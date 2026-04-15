# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Gera o Prisma Client antes do build (necessário para compilação TypeScript)
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npx nx build main-service --configuration=production
# Prune do lockfile para instalar só dependências de produção
RUN npx nx run main-service:prune

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Copia bundle Webpack + package.json com dependências de produção
COPY --from=builder /app/dist/apps/main-service ./

# Instala apenas as dependências de produção (lockfile já prunado)
RUN npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev --ignore-scripts

EXPOSE 3001

CMD ["node", "main.js"]
