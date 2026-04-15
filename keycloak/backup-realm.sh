#!/bin/bash
# =============================================================================
# Backup automático do Keycloak — realm globusdei
# Exporta usuários, roles, clients e configurações para um arquivo JSON
# Cron sugerido: 0 3 * * * /var/www/globusdei/keycloak/backup-realm.sh
# =============================================================================

set -euo pipefail

BACKUP_DIR="/var/www/globusdei/keycloak/backups"
REALM="globusdei"
KC_CONTAINER="globusdei-keycloak"
KC_URL="http://127.0.0.1:8085"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/realm-${REALM}-${DATE}.json"
KEEP_DAYS=30  # manter backups dos últimos 30 dias

# ── Criar diretório de backups se não existir ─────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Verificar se o container está rodando ─────────────────────────────────────
if ! docker inspect "$KC_CONTAINER" --format '{{.State.Status}}' 2>/dev/null | grep -q "running"; then
    echo "[$(date)] ERRO: Container $KC_CONTAINER não está rodando." >&2
    exit 1
fi

# ── Autenticar e obter token ──────────────────────────────────────────────────
KC_ADMIN=$(docker inspect "$KC_CONTAINER" --format '{{range .Config.Env}}{{println .}}{{end}}' | grep 'KC_BOOTSTRAP_ADMIN_USERNAME' | cut -d= -f2-)
KC_PASS=$(docker inspect "$KC_CONTAINER" --format '{{range .Config.Env}}{{println .}}{{end}}' | grep 'KC_BOOTSTRAP_ADMIN_PASSWORD' | cut -d= -f2-)

TOKEN=$(curl -s -X POST "${KC_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "username=${KC_ADMIN}" \
    --data-urlencode "password=${KC_PASS}" \
    --data-urlencode "grant_type=password" \
    --data-urlencode "client_id=admin-cli" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('access_token',''))")

if [ -z "$TOKEN" ]; then
    echo "[$(date)] ERRO: Falha ao obter token do Keycloak." >&2
    exit 1
fi

# ── Exportar realm completo (roles + clients) ────────────────────────────────
curl -s -X POST "${KC_URL}/admin/realms/${REALM}/partial-export?exportClients=true&exportGroupsAndRoles=true" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -o "${BACKUP_FILE}.partial"

# ── Exportar usuários separadamente (Keycloak 24 requer endpoint próprio) ─────
curl -s "${KC_URL}/admin/realms/${REALM}/users?max=10000" \
    -H "Authorization: Bearer ${TOKEN}" \
    -o "${BACKUP_FILE}.users"

# ── Mesclar usuários no JSON do realm ─────────────────────────────────────────
python3 - << PYEOF
import json
realm = json.load(open("${BACKUP_FILE}.partial"))
users = json.load(open("${BACKUP_FILE}.users"))
realm["users"] = users
json.dump(realm, open("$BACKUP_FILE", "w"), indent=2, ensure_ascii=False)
print(f"Merged: {len(users)} usuários")
PYEOF
rm -f "${BACKUP_FILE}.partial" "${BACKUP_FILE}.users"

# ── Validar o arquivo gerado ──────────────────────────────────────────────────
if ! python3 -c "import json; json.load(open('$BACKUP_FILE'))" 2>/dev/null; then
    echo "[$(date)] ERRO: Arquivo de backup inválido ou vazio." >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

USER_COUNT=$(python3 -c "import json; d=json.load(open('$BACKUP_FILE')); print(len(d.get('users', [])))" 2>/dev/null || echo "?")

echo "[$(date)] Backup concluído: $BACKUP_FILE ($USER_COUNT usuários)"

# ── Remover backups antigos (mais de KEEP_DAYS dias) ─────────────────────────
find "$BACKUP_DIR" -name "realm-${REALM}-*.json" -mtime +${KEEP_DAYS} -delete
echo "[$(date)] Limpeza: backups com mais de ${KEEP_DAYS} dias removidos."

# ── Atualizar o realm-export.json do repositório (usado no --import-realm) ───
cp "$BACKUP_FILE" "/var/www/globusdei/keycloak/realm-export.json"
echo "[$(date)] realm-export.json atualizado com o backup mais recente."
