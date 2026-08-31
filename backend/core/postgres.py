import asyncio
import os
import re
import sys
from typing import Optional
from urllib.parse import urlsplit, urlunsplit

from psycopg_pool import AsyncConnectionPool

pool: Optional[AsyncConnectionPool] = None
schema: str = "painel"

# O nome vai cru na string de conexao, entao nao pode ser qualquer coisa.
NOME_SCHEMA = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _mascarar(uri: str) -> str:
    """Esconde a senha antes de qualquer print.

    O log do Mongo faz `mongo_uri[:50]`, e 50 caracteres de
    `postgresql://user:senha@...` mostram a senha inteira. Aqui ela sai
    substituida, nao truncada.
    """
    p = urlsplit(uri)
    if p.password:
        usuario = p.username or ""
        porta = f":{p.port}" if p.port else ""
        p = p._replace(netloc=f"{usuario}:***@{p.hostname or ''}{porta}")
    return urlunsplit(p)


async def _configurar(conn):
    """Poe toda conexao do pool no schema do painel.

    Roda em TODA conexao, nao uma vez no boot: sem isto uma consulta sem
    qualificacao procura `public` -- onde o container ja tem outras coisas,
    incluindo tabelas de nome igual as nossas (`patients`). Acertar a tabela
    errada e pior que falhar.

    O `commit` no fim nao e enfeite. Fora de autocommit o `SET` abre uma
    transacao, e o pool descarta a conexao com "connection left in status
    INTRANS" -- falha que so aparece como timeout, dez segundos depois. Como o
    `SET` e de sessao (nao `SET LOCAL`), ele sobrevive ao commit.

    Ja tentei pelo parametro `options` da conexao, que seria aplicado pelo
    servidor antes da primeira consulta. Nao da para verificar aqui: o
    servidor de teste (PGlite) ignora `options` no handshake, e embarcar um
    caminho que o teste nao alcanca e o mesmo que nao testar.
    """
    await conn.execute(f"SET search_path TO {schema}")
    await conn.commit()


def esta_ligado() -> bool:
    return pool is not None


def get_pool() -> AsyncConnectionPool:
    if pool is None:
        raise RuntimeError(
            "Postgres nao inicializado: defina POSTGRES_URI e chame init_pg()."
        )
    return pool


async def init_pg() -> Optional[AsyncConnectionPool]:
    """Abre o pool do Postgres, se houver URI configurada.

    Sem POSTGRES_URI o app sobe normalmente e segue no Mongo -- que e onde ele
    ainda vive. A ausencia da variavel e estado valido, nao erro: durante a
    migracao os dois bancos coexistem.

    Nao ha valor padrao com credencial. O `docker-compose.yml` traz a senha do
    Mongo embutida como default, e e por isso que ela esta publica no
    repositorio. Aqui, sem variavel, nao ha conexao.
    """
    global pool, schema

    uri = os.getenv("POSTGRES_URI", "").strip()
    schema = os.getenv("POSTGRES_SCHEMA", "painel").strip() or "painel"

    if not uri:
        print("[INFO] POSTGRES_URI ausente: seguindo so no Mongo.")
        return None

    if not NOME_SCHEMA.match(schema):
        raise ValueError(
            f"POSTGRES_SCHEMA invalido: {schema!r}. "
            "Use apenas letras, digitos e sublinhado."
        )

    # No Windows o asyncio usa o ProactorEventLoop por padrao, e o psycopg
    # async nao roda nele: cada tentativa falha calada e o pool so desiste por
    # timeout, com o motivo enterrado em repeticoes. Em producao (Linux) isto
    # nao existe; aqui o aviso poupa dez segundos e uma investigacao.
    proactor = getattr(asyncio, "ProactorEventLoop", None)
    if sys.platform == "win32" and proactor is not None:
        if isinstance(asyncio.get_running_loop(), proactor):
            print("[AVISO] Windows com ProactorEventLoop: o psycopg nao conecta.")
            print("        Antes de subir o app, rode:")
            print("        asyncio.set_event_loop_policy("
                  "asyncio.WindowsSelectorEventLoopPolicy())")
            return None

    pool = AsyncConnectionPool(
        uri,
        min_size=1,
        max_size=int(os.getenv("POSTGRES_POOL_MAX", "10")),
        open=False,
        configure=_configurar,
        timeout=10,
    )
    await pool.open(wait=True, timeout=10)

    async with pool.connection() as conn:
        versao = (await (await conn.execute("SELECT version()")).fetchone())[0]
        existe = await (
            await conn.execute(
                "SELECT 1 FROM information_schema.schemata WHERE schema_name = %s",
                (schema,),
            )
        ).fetchone()

    print(f"[OK] Postgres: {_mascarar(uri)} (schema {schema})")
    print(f"     {versao.split(' on ')[0]}")
    if not existe:
        # Aviso, nao excecao: o app nao depende do Postgres ainda, e derrubar o
        # boot por causa disto tiraria o Mongo do ar junto.
        print(
            f"[AVISO] O schema '{schema}' nao existe. "
            "Rode migration/postgres/migracoes/001_base.sql antes de usar."
        )
    return pool


async def close_pg():
    global pool
    if pool:
        await pool.close()
        pool = None
