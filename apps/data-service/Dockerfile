# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npx nx build data-service --configuration=production
RUN npx nx run data-service:prune

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3005
ENV HOST=0.0.0.0

COPY --from=builder /app/dist/apps/data-service ./

RUN npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev --ignore-scripts

EXPOSE 3005

CMD ["node", "main.js"]
