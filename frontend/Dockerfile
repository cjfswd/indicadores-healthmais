# Stage 1: Build da aplicação React
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

ARG VITE_PROXY_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_PROXY_URL=$VITE_PROXY_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY . .
RUN pnpm run build

# Stage 2: Nginx para servir os arquivos estáticos
FROM nginx:alpine
# Copia o build do React para a pasta raiz do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Redireciona tudo para o index.html (suporte a Client-Side Routing)
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
