# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npx nx build report-service --configuration=production --skip-nx-cache
RUN npx nx run report-service:prune-lockfile --skip-nx-cache
RUN npx nx run report-service:copy-workspace-modules --skip-nx-cache

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3006
ENV HOST=0.0.0.0

COPY --from=builder /app/dist/apps/report-service ./

RUN npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev --ignore-scripts

EXPOSE 3006

CMD ["node", "main.js"]
