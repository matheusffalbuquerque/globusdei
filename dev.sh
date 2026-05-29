#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — Sobe toda a stack de desenvolvimento local
#
# Uso:
#   ./dev.sh           → sobe infra (Docker) + todos os serviços (Nx)
#   ./dev.sh infra     → só Docker (postgres, redis, etc.)
#   ./dev.sh services  → só os serviços Nx (assume infra já rodando)
#   ./dev.sh stop      → derruba a infra Docker
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Cores ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[dev]${NC} $*"; }
ok()   { echo -e "${GREEN}[dev]${NC} $*"; }
warn() { echo -e "${YELLOW}[dev]${NC} $*"; }

# ── Funções ──────────────────────────────────────────────────────────────────

start_infra() {
  log "Subindo infraestrutura Docker (postgres, mongodb, redis, rabbitmq, keycloak)..."
  sudo docker compose up -d postgres mongodb redis rabbitmq keycloak
  ok "Infraestrutura pronta!"
}

wait_postgres() {
  log "Aguardando PostgreSQL ficar healthy..."
  for i in $(seq 1 20); do
    if sudo docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-globusdei}" -q 2>/dev/null; then
      ok "PostgreSQL está pronto."
      return 0
    fi
    echo "  tentativa $i/20 — aguardando 3s..."
    sleep 3
  done
  warn "PostgreSQL não respondeu a tempo. Continuando mesmo assim..."
}

start_services() {
  log "Iniciando serviços Nx..."

  # main-service e finance-service via webpack (serve)
  # notification-service via serve
  # staff-platform e web-platform via next dev
  npx nx run-many \
    --target=serve \
    --projects=main-service,finance-service,notification-service \
    --parallel=3 &
  NX_BACKENDS_PID=$!

  # Aguarda backends subirem antes de iniciar os frontends
  log "Aguardando backends subirem (15s)..."
  sleep 15

  log "Iniciando frontends Next.js..."
  npx nx dev web-platform &
  WEB_PLATFORM_PID=$!

  npx nx dev staff-platform -- --port 3008 &
  STAFF_PLATFORM_PID=$!

  ok "Todos os serviços iniciados!"
  echo ""
  echo -e "  ${GREEN}web-platform${NC}   → http://localhost:3000"
  echo -e "  ${GREEN}staff-platform${NC} → http://localhost:3008"
  echo -e "  ${GREEN}main-service${NC}   → http://localhost:3001"
  echo -e "  ${GREEN}finance-service${NC}→ http://localhost:3002"
  echo -e "  ${GREEN}notification${NC}   → http://localhost:3004"
  echo -e "  ${GREEN}keycloak${NC}       → http://localhost:8085"
  echo ""
  warn "Pressione Ctrl+C para encerrar todos os serviços."

  # Aguarda qualquer processo filho terminar e encerra os demais
  trap 'log "Encerrando serviços..."; kill $NX_BACKENDS_PID $WEB_PLATFORM_PID $STAFF_PLATFORM_PID 2>/dev/null; exit 0' INT TERM

  wait
}

stop_infra() {
  log "Derrubando infraestrutura Docker..."
  sudo docker compose down
  ok "Infraestrutura encerrada."
}

# ── Entrypoint ────────────────────────────────────────────────────────────────

case "${1:-all}" in
  infra)
    start_infra
    ;;
  services)
    start_services
    ;;
  stop)
    stop_infra
    ;;
  all|*)
    start_infra
    wait_postgres
    start_services
    ;;
esac
