# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
# Webpack empacota tudo em main.js — sem package.json próprio, prune não é necessário
RUN npx nx build notification-service --configuration=production --skip-nx-cache

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3004
ENV HOST=0.0.0.0

# Copia apenas o bundle gerado pelo Webpack
COPY --from=builder /app/dist/apps/notification-service/main.js ./main.js

EXPOSE 3004

CMD ["node", "main.js"]
