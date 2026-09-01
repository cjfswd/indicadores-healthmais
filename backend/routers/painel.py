import json
import os
import re
from pathlib import Path

import jwt
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse

from core import painel_mongo, postgres
from core.seguranca import jwt_secret as _jwt_secret
from core.database import get_db

router = APIRouter(prefix="/painel", tags=["painel"])

CONSULTAS = Path(__file__).resolve().parent.parent / "consultas_painel.sql"

# Uma consulta por pagina, separadas por `-- @nome`. O mesmo arquivo que o
# painel_do_postgres.mjs usa para provar, contra Postgres real, que a saida
# daqui e identica ao dados.json montado do dump.
_BLOCOS = re.compile(r"^-- @", re.MULTILINE)


def carregar_consultas() -> dict:
    bruto = CONSULTAS.read_text(encoding="utf-8")
    consultas = {}
    for bloco in _BLOCOS.split(bruto)[1:]:
        quebra = bloco.index("\n")
        consultas[bloco[:quebra].strip()] = bloco[quebra + 1:]
    return consultas


def exigir_sessao(authorization: str = Header(default="")) -> dict:
    """Exige um JWT valido. Sem excecao e sem fallback.

    O `_extract_actor` de proxy.py tambem le o Bearer, mas so para saber quem
    agiu: se o token faltar ou nao valer, ele segue com o email do corpo da
    requisicao. Aqui isso nao serve -- a resposta carrega nome de paciente e
    observacao clinica, e quem pergunta precisa ter provado quem e.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sessao ausente")
    try:
        return jwt.decode(
            authorization[7:],
            _jwt_secret(),
            algorithms=["HS256"],
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Sessao invalida")


def montar_relatorios(eventos: list) -> dict:
    """Pivo de eventos por indicador e mes.

    Derivado aqui, e nao no SQL, porque a pagina de Relatorios ja o monta desta
    forma a partir dos eventos -- e um `crosstab` no banco obrigaria a fixar as
    colunas de mes, que mudam a cada competencia.
    """
    meses = sorted({(e.get("data") or "")[:7] for e in eventos if e.get("data")})
    linhas = []
    for indicador in sorted({e["indicador"] for e in eventos}):
        do_ind = [e for e in eventos if e["indicador"] == indicador]
        linhas.append({
            "nivel": "indicador",
            "nome": indicador,
            "total": len(do_ind),
            "meses": {m: sum(1 for e in do_ind if (e.get("data") or "").startswith(m))
                      for m in meses},
        })
    return {"meses": meses, "linhas": linhas}


@router.get("/dados")
async def dados(authorization: str = Header(default=""), fonte: str = ""):
    """Devolve o JSON que o painel desenha, da base em uso.

    A base em uso e o Mongo: e nele que `/db/execute` grava, com event store,
    soft update e SOFT_DELETE. Ler de outro lugar faria o painel esconder o que
    a equipe acabou de registrar -- e, sem POSTGRES_URI (que nao tem default no
    docker-compose), a resposta era 503 e a tela ficava vazia em producao.

    `?fonte=postgres` roda as consultas do schema novo, quando ele existe. E o
    caminho da conciliacao: mesma forma, mesmos nomes de campo, para comparar
    as duas saidas sem tocar na tela.
    """
    exigir_sessao(authorization)

    if fonte != "postgres":
        saida = await painel_mongo.montar(get_db())
        saida["relatorios"] = montar_relatorios(saida.get("eventos", []))
        return JSONResponse(content=json.loads(json.dumps(saida, default=str)))

    if not postgres.esta_ligado():
        # 503 e nao 500: nao ha defeito, ha configuracao faltando. Durante a
        # migracao subir sem POSTGRES_URI e um estado legitimo.
        raise HTTPException(
            status_code=503,
            detail="Postgres nao configurado neste ambiente (POSTGRES_URI).",
        )

    saida = {"fonte": "postgres · schema " + postgres.schema}
    async with postgres.get_pool().connection() as conn:
        for nome, sql in carregar_consultas().items():
            async with conn.cursor() as cur:
                await cur.execute(sql)
                colunas = [d.name for d in cur.description]
                saida[nome] = [dict(zip(colunas, linha))
                               for linha in await cur.fetchall()]

    saida["relatorios"] = montar_relatorios(saida.get("eventos", []))
    # default=str para date/datetime que escaparem das consultas -- elas ja
    # formatam com to_char, mas uma coluna nova nao pode derrubar a pagina.
    return JSONResponse(content=json.loads(json.dumps(saida, default=str)))


@router.get("/saude")
async def saude():
    """Diz se a fonte esta de pe, sem exigir sessao e sem devolver dado.

    Serve para conferir a configuracao sem precisar de um login valido. O
    painel nao depende mais disto para decidir de onde le: ele pede /dados, que
    responde da base em uso.
    """
    if not postgres.esta_ligado():
        return {"postgres": False, "schema": None, "pacientes": None}
    try:
        async with postgres.get_pool().connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT count(*) FROM patients")
                total = (await cur.fetchone())[0]
        return {"postgres": True, "schema": postgres.schema, "pacientes": total}
    except Exception as e:
        return {"postgres": False, "schema": postgres.schema, "erro": type(e).__name__}
