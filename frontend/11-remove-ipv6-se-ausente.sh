#!/bin/sh
# Roda no entrypoint da imagem nginx, depois do 10-listen-on-ipv6-by-default.sh.
#
# A configuracao versionada traz `listen [::]:80;` porque o script da imagem
# nao o adiciona em configuracao customizada -- ele so mexe na empacotada, e
# com a nossa registra "differs from the packaged version" e desiste. Sem essa
# linha o nginx escuta so em IPv4, e um proxy que resolva o container para o
# endereco IPv6 fica esperando resposta de um socket que ninguem atende.
#
# Mas se o container nao tiver IPv6, essa mesma linha impede o nginx de subir:
# "socket() [::]:80 failed (97: Address family not supported by protocol)".
# Entao aqui a linha sai quando nao ha suporte. O contrario do script oficial,
# pela mesma razao dele.
set -e

if [ ! -f /proc/net/if_inet6 ]; then
    echo "$0: sem IPv6 neste container, removendo o listen [::]:80"
    sed -i '/listen \[::\]:80;/d' /etc/nginx/conf.d/default.conf
else
    echo "$0: IPv6 disponivel, mantendo o listen [::]:80"
fi
