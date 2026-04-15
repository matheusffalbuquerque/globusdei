# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
# Recria o project graph do Nx (workspace-data não é commitado no git)
RUN npx nx reset
# Webpack empacota tudo em main.js — prune não é necessário (sem package.json próprio)
RUN npx nx build data-service --configuration=production --skip-nx-cache

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3005
ENV HOST=0.0.0.0

# Copia o package.json gerado pelo Nx (lista deps externas não bundladas)
COPY --from=builder /app/dist/apps/data-service/package.json ./package.json
# Copia o package-lock.json raiz para resolver versões precisas
COPY --from=builder /app/package-lock.json ./package-lock.json
# Instala apenas dependências de produção
RUN npm ci --omit=dev --ignore-scripts

# tslib é devDependency mas referenciado externalmente — copia do builder
COPY --from=builder /app/node_modules/tslib ./node_modules/tslib

# Copia o bundle gerado pelo Webpack
COPY --from=builder /app/dist/apps/data-service/main.js ./main.js

EXPOSE 3005

CMD ["node", "main.js"]
