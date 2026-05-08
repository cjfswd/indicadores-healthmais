# Usa uma imagem leve do Node
FROM node:20-alpine AS builder

WORKDIR /app
# Habilita e instala o pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# Compila o TypeScript para a pasta dist/
RUN pnpm run build

# Stage de Runner (Apenas arquivos de produção)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instala dependências do sistema necessárias para o Python e ReportLab
RUN apk add --no-cache python3 py3-pip py3-pillow

# Copia o requirements.txt e instala as libs do python
COPY requirements.txt ./
RUN pip install --break-system-packages -r requirements.txt

# Copia package.json para instalar apenas dependências de produção
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod --frozen-lockfile

# Copia apenas o build final do TS e os scripts python
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/scripts ./src/scripts

# A porta 3000 deve bater com a env PORT, que é o padrão no server.ts
EXPOSE 3000
CMD ["pnpm", "run", "start"]
