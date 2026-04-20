#!/usr/bin/env bash
# =============================================================================
# restore-db.sh — Restauração do banco PostgreSQL do Globus Dei
# =============================================================================
# Uso:
#   ./tools/scripts/restore-db.sh                          → restaura o último full
#   ./tools/scripts/restore-db.sh backups/globusdei_full_20260420_120000.sql.gz
# =============================================================================

set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-globusdei-postgres}"
DB_USER="${POSTGRES_USER:-globusdei}"
DB_PASS="${POSTGRES_PASSWORD:-root}"
DB_NAME="${POSTGRES_DB:-globusdei_db}"
DB_SCHEMA="${POSTGRES_SCHEMA:-app}"
BACKUP_DIR="${BACKUP_DIR:-/var/www/globusdei/backups}"

RESTORE_FILE="${1:-${BACKUP_DIR}/globusdei_full_latest.sql.gz}"

if [ ! -f "$RESTORE_FILE" ]; then
  echo "❌ Arquivo não encontrado: ${RESTORE_FILE}"
  echo "   Backups disponíveis:"
  ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print "   " $9}' | sed "s|${BACKUP_DIR}/||g" || echo "   (nenhum)"
  exit 1
fi

echo "============================================"
echo " Globus Dei — Restauração PostgreSQL"
echo "============================================"
echo " Arquivo   : $(basename $RESTORE_FILE)"
echo " Container : ${CONTAINER}"
echo " Banco     : ${DB_NAME} (schema: ${DB_SCHEMA})"
echo "--------------------------------------------"
echo "⚠️  ATENÇÃO: Isso irá substituir os dados do schema '${DB_SCHEMA}'!"
read -p "   Digite 'sim' para confirmar: " CONFIRM

if [ "$CONFIRM" != "sim" ]; then
  echo "❌ Restauração cancelada."
  exit 1
fi

echo ""
echo " Iniciando restauração..."

# Faz backup de segurança antes de restaurar
SAFETY_BACKUP="${BACKUP_DIR}/globusdei_full_before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
echo " 🔒 Fazendo backup de segurança antes de restaurar..."
PGPASSWORD="$DB_PASS" docker exec -e PGPASSWORD="$DB_PASS" "$CONTAINER" \
  pg_dump \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --schema="$DB_SCHEMA" \
    --format=plain \
    --no-owner \
    --no-acl \
  | gzip > "$SAFETY_BACKUP"
echo " ✅ Backup de segurança: $(basename $SAFETY_BACKUP) ($(du -sh $SAFETY_BACKUP | cut -f1))"

# Restaurar
echo " 📥 Restaurando dados..."
gunzip -c "$RESTORE_FILE" | \
  PGPASSWORD="$DB_PASS" docker exec -i -e PGPASSWORD="$DB_PASS" "$CONTAINER" \
    psql \
      --username="$DB_USER" \
      --dbname="$DB_NAME" \
      -v ON_ERROR_STOP=0 \
      -q 2>&1 | grep -E "ERROR|error" | grep -v "already exists\|duplicate" | head -20 || true

echo "--------------------------------------------"
echo " ✅ Restauração concluída!"
echo " Caso precise reverter, use:"
echo "   ./tools/scripts/restore-db.sh ${SAFETY_BACKUP}"
echo "============================================"
