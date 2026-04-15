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
# Recria o project graph do Nx (workspace-data não é commitado no git)
RUN npx nx reset
RUN npx nx build main-service --configuration=production --skip-nx-cache

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Copia o package.json gerado pelo Nx (lista deps externas não bundladas)
COPY --from=builder /app/dist/apps/main-service/package.json ./package.json
# Copia o package-lock.json raiz para resolver versões precisas
COPY --from=builder /app/package-lock.json ./package-lock.json
# Instala apenas dependências de produção
RUN npm ci --omit=dev --ignore-scripts

# Copia o Prisma Client gerado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copia o bundle gerado pelo Webpack
COPY --from=builder /app/dist/apps/main-service/main.js ./main.js

EXPOSE 3001

CMD ["node", "main.js"]
