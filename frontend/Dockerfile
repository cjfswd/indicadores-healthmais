# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Ativar corepack para pnpm
RUN corepack enable pnpm

# Copiar arquivos de dependência
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar resto do código
COPY . .

# Build args passados pelo Coolify / docker-compose
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build de produção (VITE_API_URL fica vazio = URLs relativas)
RUN pnpm build

# ─── Serve stage ───
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
