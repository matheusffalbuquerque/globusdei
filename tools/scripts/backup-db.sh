#!/usr/bin/env bash
# =============================================================================
# backup-db.sh — Backup do banco PostgreSQL do Globus Dei
# =============================================================================
# Uso:
#   ./tools/scripts/backup-db.sh              → backup completo
#   ./tools/scripts/backup-db.sh --schema     → apenas schema (sem dados)
#   ./tools/scripts/backup-db.sh --data       → apenas dados (sem schema)
#   KEEP_DAYS=30 ./tools/scripts/backup-db.sh → retenção customizada
# =============================================================================

set -euo pipefail

# ── Configurações ─────────────────────────────────────────────────────────────
CONTAINER="${POSTGRES_CONTAINER:-globusdei-postgres}"
DB_USER="${POSTGRES_USER:-globusdei}"
DB_PASS="${POSTGRES_PASSWORD:-root}"
DB_NAME="${POSTGRES_DB:-globusdei_db}"
DB_SCHEMA="${POSTGRES_SCHEMA:-app}"
BACKUP_DIR="${BACKUP_DIR:-/var/www/globusdei/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"          # dias de retenção
MODE="${1:-}"                          # --schema | --data | (vazio = completo)

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

case "$MODE" in
  --schema)
    SUFFIX="schema"
    PG_FLAGS="--schema-only"
    ;;
  --data)
    SUFFIX="data"
    PG_FLAGS="--data-only"
    ;;
  *)
    SUFFIX="full"
    PG_FLAGS=""
    ;;
esac

FILENAME="globusdei_${SUFFIX}_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"
LATEST_LINK="${BACKUP_DIR}/globusdei_${SUFFIX}_latest.sql.gz"

# ── Criar diretório de backup ─────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

echo "============================================"
echo " Globus Dei — Backup PostgreSQL"
echo "============================================"
echo " Modo      : ${SUFFIX}"
echo " Container : ${CONTAINER}"
echo " Banco     : ${DB_NAME} (schema: ${DB_SCHEMA})"
echo " Destino   : ${FILEPATH}"
echo "--------------------------------------------"

# ── Executar pg_dump ──────────────────────────────────────────────────────────
PGPASSWORD="$DB_PASS" docker exec -e PGPASSWORD="$DB_PASS" "$CONTAINER" \
  pg_dump \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --schema="$DB_SCHEMA" \
    --format=plain \
    --no-owner \
    --no-acl \
    $PG_FLAGS \
  | gzip > "$FILEPATH"

SIZE=$(du -sh "$FILEPATH" | cut -f1)
echo " ✅ Backup criado: ${FILENAME} (${SIZE})"

# ── Link para o mais recente ──────────────────────────────────────────────────
ln -sf "$FILEPATH" "$LATEST_LINK"
echo " 🔗 Link atualizado: $(basename $LATEST_LINK)"

# ── Limpeza de backups antigos ────────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "globusdei_${SUFFIX}_*.sql.gz" \
  -not -name "$(basename $LATEST_LINK)" \
  -mtime +${KEEP_DAYS} -print -delete | wc -l | tr -d ' ')

if [ "$DELETED" -gt "0" ]; then
  echo " 🗑️  ${DELETED} backup(s) antigo(s) removido(s) (>${KEEP_DAYS} dias)"
fi

echo "--------------------------------------------"
echo " Backups existentes:"
ls -lh "$BACKUP_DIR"/globusdei_${SUFFIX}_*.sql.gz 2>/dev/null | \
  awk '{print "   " $5 "  " $9}' | sed "s|${BACKUP_DIR}/||g"
echo "============================================"
echo " Concluído em: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
