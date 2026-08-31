# -*- coding: utf-8 -*-
"""A API do painel: autenticacao e forma da resposta.

    cd migration/postgres && node servidor_teste.mjs --com-schema &
    cd backend && python testar_painel_api.py <data.sql>

Sobe a app de verdade contra um Postgres de verdade (PGlite pela rede) e bate
nos endpoints por HTTP. Nao usa TestClient porque ele exige httpx, que nao e
dependencia do projeto -- e o que esta sob teste inclui o caminho HTTP.

A resposta carrega nome de paciente e observacao clinica, entao os quatro
primeiros casos sao os que mais importam: quem nao provou quem e nao entra.
"""
import asyncio
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request

if sys.platform == "win32":
    # O psycopg async nao roda no ProactorEventLoop, padrao do Windows.
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

PG = os.getenv("PG_TESTE", "postgresql://teste:senha@127.0.0.1:5433/postgres")
SEGREDO = "segredo_de_teste"
PORTA = 3001
BASE = f"http://127.0.0.1:{PORTA}"

os.environ.update({"POSTGRES_URI": PG, "POSTGRES_SCHEMA": "painel",
                   "JWT_SECRET": SEGREDO, "MONGO_URI": "memory"})
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

falhas = []


def conferir(titulo, ok, extra=""):
    print(("  ok    " if ok else "  FALHA ") + titulo + ("" if ok else f"  {extra}"))
    if not ok:
        falhas.append(titulo)


def pedir(caminho, token=None):
    req = urllib.request.Request(BASE + caminho)
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: python testar_painel_api.py <data.sql>")
        return 1

    import psycopg
    with psycopg.connect(PG, autocommit=True) as c:
        with c.cursor() as cur:
            cur.execute("SET search_path TO painel")
            cur.execute("SELECT count(*) FROM patients")
            if cur.fetchone()[0] == 0:
                cur.execute(open(sys.argv[1], encoding="utf-8").read())

    import jwt
    import uvicorn
    from main import app

    servidor = uvicorn.Server(uvicorn.Config(
        app, host="127.0.0.1", port=PORTA, log_level="error"))

    def rodar():
        # O uvicorn instala o ProactorEventLoop no Windows por conta propria,
        # entao nao basta a policy: o loop tem que nascer aqui.
        laco = asyncio.SelectorEventLoop()
        asyncio.set_event_loop(laco)
        laco.run_until_complete(servidor.serve())

    threading.Thread(target=rodar, daemon=True).start()
    for _ in range(60):
        try:
            urllib.request.urlopen(BASE + "/painel/saude", timeout=2)
            break
        except Exception:
            time.sleep(0.5)

    print("--- quem pode ler ---")
    st, corpo = pedir("/painel/saude")
    conferir("saude nao exige sessao e nao devolve dado",
             st == 200 and corpo.get("postgres") is True
             and corpo.get("pacientes") == 142, corpo)

    conferir("sem token -> 401", pedir("/painel/dados")[0] == 401)
    conferir("token que nao e jwt -> 401",
             pedir("/painel/dados", "lixo.nao.e.jwt")[0] == 401)
    outro = jwt.encode({"email": "x@y.com"}, "outro_segredo", algorithm="HS256")
    conferir("assinado com outro segredo -> 401",
             pedir("/painel/dados", outro)[0] == 401)

    bom = jwt.encode({"id": "1", "email": "ana@healthmaiscuidados.com"},
                     SEGREDO, algorithm="HS256")
    st, dados = pedir("/painel/dados", bom)
    conferir("sessao valida -> 200", st == 200, st)
    if st != 200:
        print(f"\n{len(falhas)} FALHA(S)")
        return 1

    print("\n--- a resposta e o que a tela espera ---")
    for chave, n in {"operadoras": 3, "pacientes": 142, "eventos": 206,
                     "notificacoes": 222, "usuarios": 10, "triagem": 3,
                     "profissionais": 9, "auditoria": 972}.items():
        conferir(f"{chave}: {n}", len(dados.get(chave, [])) == n,
                 len(dados.get(chave, [])))

    conferir("relatorios trazem o pivo", bool(dados.get("relatorios", {}).get("linhas")))
    conferir("a fonte se identifica", "postgres" in dados.get("fonte", ""),
             dados.get("fonte"))
    conferir("o paciente tem os campos das colunas",
             {"nome", "operadora", "situacao", "eventos", "observacoes"}
             <= set(dados["pacientes"][0]), sorted(dados["pacientes"][0]))

    sit = {}
    for p in dados["pacientes"]:
        sit[p["situacao"]] = sit.get(p["situacao"], 0) + 1
    conferir("situacao 80/12/50 -- a migracao de inativacao esta na carga",
             sit == {"ativo": 80, "inativo": 12, "excluido": 50}, sit)

    print("\n" + (f"{len(falhas)} FALHA(S)" if falhas else "API do painel ok"))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
