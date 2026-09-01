# -*- coding: utf-8 -*-
"""Segredo de assinatura do JWT, de um lugar so.

O valor `coringa_secret_key` vinha embutido como fallback em tres routers e no
docker-compose. Estando publico no repositorio, quem o tivesse podia forjar
qualquer sessao. Aqui a fonte e o ambiente; sem ela, um segredo aleatorio por
processo -- nunca mais um default conhecido.
"""
import os
import secrets

_gerado = None


def jwt_secret() -> str:
    """Le JWT_SECRET do ambiente. Ausente, gera um aleatorio por processo.

    O aleatorio mantem o dev funcionando -- os tokens valem dentro de uma
    execucao -- sem reintroduzir um segredo conhecido. Some no restart, o que
    desloga: em producao, JWT_SECRET tem que estar definido, e o aviso abaixo
    existe para ninguem descobrir isso por acidente.
    """
    global _gerado
    do_ambiente = os.getenv("JWT_SECRET", "").strip()
    if do_ambiente:
        return do_ambiente
    if _gerado is None:
        _gerado = secrets.token_hex(32)
        print("[AVISO] JWT_SECRET ausente: usando segredo aleatorio deste "
              "processo. As sessoes caem no restart. Defina JWT_SECRET em "
              "producao.")
    return _gerado
