# -*- coding: utf-8 -*-
"""Restricao de dominio no login com Google.

    cd backend && python testar_auth.py

ALLOWED_DOMAIN estava no docker-compose.yml desde sempre e nenhum .py a lia:
qualquer conta Google entrava e era criada como usuario novo. Este teste
existe para essa porta nao reabrir sem alguem perceber.

A resposta da Google e simulada -- o que esta sob teste e a decisao, nao a
chamada externa.
"""
import asyncio
import contextlib
import io
import json
import sys
import urllib.request

from fastapi import HTTPException

sys.path.insert(0, ".")
import routers.auth as A  # noqa: E402


class ChegouNoBanco(BaseException):
    """BaseException de proposito.

    O router tem um `except Exception` largo que transforma qualquer falha em
    401. Um sentinela comum seria engolido e o teste veria 401 em vez do
    resultado real -- foi o que aconteceu na primeira versao disto.
    """


class RespostaFalsa(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


class PedidoFalso:
    def __init__(self, corpo):
        self._c = corpo

    async def json(self):
        return self._c


def caso(titulo, userinfo, dominio, esperado, falhas):
    A.os.environ["ALLOWED_DOMAIN"] = dominio
    urllib.request.urlopen = lambda *a, **k: RespostaFalsa(
        json.dumps(userinfo).encode()
    )
    A.get_db = lambda: (_ for _ in ()).throw(ChegouNoBanco())
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            asyncio.run(A.auth_google(PedidoFalso({"access_token": "x"})))
        obtido = 200
    except HTTPException as e:
        obtido = e.status_code
    except ChegouNoBanco:
        obtido = "chegou no banco"
    ok = obtido == esperado
    print(("  ok    " if ok else "  FALHA ") + f"{titulo:40} -> {obtido}")
    if not ok:
        falhas.append(titulo)


def main():
    D = "healthmaiscuidados.com"
    falhas = []
    casos = [
        ("conta de fora barrada com 403", {"email": "x@gmail.com", "email_verified": True}, D, 403),
        ("email nao verificado barrado", {"email": "x@" + D, "email_verified": False}, D, 403),
        ("subdominio barrado", {"email": "x@sub." + D, "email_verified": True}, D, 403),
        ("dominio como prefixo barrado", {"email": "x@" + D + ".invasor.net", "email_verified": True}, D, 403),
        ("resposta sem email vira 400", {"email_verified": True}, D, 400),
        ("conta do dominio passa", {"email": "x@" + D, "email_verified": True}, D, "chegou no banco"),
        ("email_verified ausente nao barra", {"email": "x@" + D}, D, "chegou no banco"),
        ("sem ALLOWED_DOMAIN qualquer conta passa", {"email": "x@gmail.com", "email_verified": True}, "", "chegou no banco"),
    ]
    for titulo, userinfo, dominio, esperado in casos:
        caso(titulo, userinfo, dominio, esperado, falhas)

    print("\n" + (f"{len(falhas)} FALHA(S)" if falhas else "restricao de dominio confere"))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
