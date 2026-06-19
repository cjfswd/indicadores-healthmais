FROM denoland/deno:2.3.3

WORKDIR /app

# Cache deps before copying all files
COPY deno.json .
COPY deno.lock* .
RUN deno install --frozen --allow-scripts=npm:pdfkit,npm:canvas 2>/dev/null || deno install --frozen 2>/dev/null || true

COPY . .

# Build Fresh (gera fresh.gen.ts com routes e islands)
RUN deno task build 2>/dev/null || true

EXPOSE 8000

CMD ["deno", "task", "start"]
