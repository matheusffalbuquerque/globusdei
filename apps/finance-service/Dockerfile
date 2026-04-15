# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
# Recria o project graph do Nx (workspace-data não é commitado no git)
RUN npx nx reset
RUN npx nx build finance-service --configuration=production --skip-nx-cache

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3002
ENV HOST=0.0.0.0

# Copia apenas o bundle gerado pelo Webpack
COPY --from=builder /app/dist/apps/finance-service/main.js ./main.js

EXPOSE 3002

CMD ["node", "main.js"]
