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
# Webpack empacota tudo em main.js — sem package.json próprio, prune não é necessário
RUN npx nx build main-service --configuration=production --skip-nx-cache

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Copia apenas o bundle gerado pelo Webpack
COPY --from=builder /app/dist/apps/main-service/main.js ./main.js

EXPOSE 3001

CMD ["node", "main.js"]
