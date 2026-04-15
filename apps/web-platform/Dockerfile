# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Instala dependências do sistema necessárias para build nativo
RUN apk add --no-cache python3 make g++ openssl

# Copia manifesto de pacotes e instala dependências
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copia schema Prisma e gera client antes do build
COPY prisma ./prisma
RUN npx prisma generate

# Copia todo o monorepo e executa o build do Next.js via Nx
COPY . .
RUN npx nx build web-platform --configuration=production

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copia artefatos do build standalone do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-platform/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-platform/.next/static ./apps/web-platform/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-platform/public ./apps/web-platform/public

USER nextjs

EXPOSE 3000

# O standalone output gera um server.js na raiz do diretório standalone
CMD ["node", "apps/web-platform/server.js"]
