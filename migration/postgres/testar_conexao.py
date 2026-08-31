# -*- coding: utf-8 -*-
"""Testa core/postgres.py contra um Postgres real.

    node servidor_teste.mjs --com-schema &
    python testar_conexao.py

Confere os tres estados que o backend encontra em producao: sem variavel
(hoje), com variavel e schema ausente (entre a Etapa 1 e a 2 do PLANO), e com
schema aplicado (depois da Etapa 2).
"""
import asyncio, io, os, sys, contextlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
from core import postgres  # noqa: E402

URI = "postgresql://teste:senha_secreta_123@127.0.0.1:5433/postgres"
falhas = []


def conferir(titulo, ok, detalhe=""):
    print(("  ok    " if ok else "  FALHA ") + titulo + (f"  [{detalhe}]" if detalhe and not ok else ""))
    if not ok:
        falhas.append(titulo)


async def com_env(**env):
    """Roda init_pg com o ambiente dado, capturando o que ele imprime."""
    antigos = {k: os.environ.get(k) for k in ("POSTGRES_URI", "POSTGRES_SCHEMA")}
    os.environ.pop("POSTGRES_URI", None)
    os.environ.pop("POSTGRES_SCHEMA", None)
    os.environ.update({k: v for k, v in env.items() if v is not None})
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            r = await postgres.init_pg()
        return r, buf.getvalue()
    finally:
        for k, v in antigos.items():
            os.environ.pop(k, None)
            if v is not None:
                os.environ[k] = v


async def main():
    print("--- sem POSTGRES_URI (producao hoje) ---")
    r, saida = await com_env()
    conferir("nao conecta e nao levanta excecao", r is None)
    conferir("avisa que segue no Mongo", "seguindo so no Mongo" in saida, saida.strip())
    conferir("esta_ligado() e False", postgres.esta_ligado() is False)
    try:
        postgres.get_pool()
        conferir("get_pool() explica o que fazer", False, "nao levantou")
    except RuntimeError as e:
        conferir("get_pool() explica o que fazer", "POSTGRES_URI" in str(e))

    print("\n--- com schema inexistente (entre Etapa 1 e 2) ---")
    r, saida = await com_env(POSTGRES_URI=URI, POSTGRES_SCHEMA="nao_existe")
    conferir("conecta mesmo assim", r is not None)
    conferir("avisa que o schema falta e cita a 001_base",
             "nao existe" in saida and "001_base" in saida, saida.strip())
    await postgres.close_pg()

    print("\n--- com schema painel aplicado (depois da Etapa 2) ---")
    r, saida = await com_env(POSTGRES_URI=URI)
    conferir("conecta", r is not None)
    conferir("nao avisa nada", "[AVISO]" not in saida, saida.strip())
    conferir("a senha nao aparece no log", "senha_secreta_123" not in saida, saida.strip())
    conferir("o log mostra o host", "127.0.0.1" in saida, saida.strip())

    async with postgres.get_pool().connection() as conn:
        sp = (await (await conn.execute("SHOW search_path")).fetchone())[0]
        conferir("search_path e painel em conexao nova", "painel" in sp, sp)
        # A prova real: consulta SEM qualificar o schema tem que achar a tabela.
        n = (await (await conn.execute("SELECT count(*) FROM patients")).fetchone())[0]
        conferir("SELECT sem qualificar acha painel.patients", n == 0, str(n))
        v = (await (await conn.execute("SELECT versao FROM migracoes")).fetchone())[0]
        conferir("le a versao da migracao", v == "001_base", v)

    # Duas conexoes seguidas: o configure roda em toda, nao so na primeira.
    async with postgres.get_pool().connection() as conn:
        sp = (await (await conn.execute("SHOW search_path")).fetchone())[0]
        conferir("search_path vale na segunda conexao tambem", "painel" in sp, sp)

    await postgres.close_pg()
    conferir("close_pg() zera o estado", postgres.esta_ligado() is False)

    print("\n" + (f"{len(falhas)} FALHA(S)" if falhas else "conexao ok nos tres estados"))
    return 1 if falhas else 0


# O psycopg async nao roda no ProactorEventLoop, que e o padrao do
# Windows. Producao e Linux e nao precisa disto; o teste, aqui, precisa.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.exit(asyncio.run(main()))
