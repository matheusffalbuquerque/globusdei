# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npx nx build finance-service --configuration=production --skip-nx-cache
RUN npx nx run finance-service:prune-lockfile --skip-nx-cache
RUN npx nx run finance-service:copy-workspace-modules --skip-nx-cache

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3002
ENV HOST=0.0.0.0

COPY --from=builder /app/dist/apps/finance-service ./

RUN npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev --ignore-scripts

EXPOSE 3002

CMD ["node", "main.js"]
