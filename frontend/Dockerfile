# O contexto de build e a RAIZ do repositorio, nao frontend/ -- a imagem
# precisa copiar tambem o painel, que vive em docs/. Por isso todo COPY daqui
# leva o prefixo frontend/. O .dockerignore da raiz e o que evita mandar
# .venv e node_modules para o daemon.

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm na mesma versão do dev local
RUN npm install -g pnpm@10.17.0

# Copiar arquivos de dependência
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar resto do código
COPY frontend/ .

# Build args passados pelo Coolify / docker-compose
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build de produção
RUN pnpm build

# ─── Serve stage ───
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Roda no boot, depois do script de IPv6 da propria imagem. Deixa o
# `listen [::]:80` quando ha IPv6 e o remove quando nao ha -- sem isto a linha
# seria aposta cega: util num container com IPv6, fatal num sem.
COPY --chmod=0755 frontend/11-remove-ipv6-se-ausente.sh /docker-entrypoint.d/11-remove-ipv6-se-ausente.sh

COPY --from=builder /app/dist /usr/share/nginx/html

# ─── Painel de indicadores, na raiz ───
# A raiz e a URL que o Google ja tem registrada como redirecionamento do
# OAuth. Servir o painel em /painel/ exigiria registrar outra URI, e ate la o
# login recusaria com redirect_uri_mismatch -- por isso ele assume /.
#
# O app Vue nao sai da imagem: o index dele vira legado.html e os assets
# continuam servidos, entao voltar atras e renomear um arquivo. Standby, nao
# remocao.
RUN mv /usr/share/nginx/html/index.html /usr/share/nginx/html/legado.html
COPY docs/novo-modelo/prototipo/painel.html /usr/share/nginx/html/index.html

# O ARG precisa ser redeclarado: ele nao atravessa estagios.
ARG VITE_GOOGLE_CLIENT_ID

# Duas substituicoes no HTML, ambas em meta tags que existem justamente para
# isto. O client id liga o login com Google -- sem ele o painel abre em modo
# prototipo. O caminho dos assets do certificado muda porque o Vite copia
# frontend/public/ para a raiz servida.
RUN sed -i \
      -e "s|<meta name=\"google-client-id\" content=\"\">|<meta name=\"google-client-id\" content=\"${VITE_GOOGLE_CLIENT_ID}\">|" \
      -e "s|content=\"../../../frontend/public/certificates/\"|content=\"/certificates/\"|" \
      /usr/share/nginx/html/index.html \
 && grep -q 'name="cert-assets" content="/certificates/"' /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
