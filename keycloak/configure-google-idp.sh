#!/bin/sh
# configure-google-idp.sh
# 1. Injects real Google OAuth credentials into the Keycloak IdP.
# 2. Creates an auto-link First Broker Login flow so users with an existing
#    account are silently linked — the "Account already exists" page never shows.
#
# ORDER IS CRITICAL:
#   a) Update IdP credentials (keep default flow for now)
#   b) Create "google-auto-link" flow (copy of first broker login)
#   c) Disable confirm-link and review-profile steps in the copy
#   d) Switch IdP to use the new flow

set -e

KC_URL="${KEYCLOAK_URL:-http://keycloak:8080}"
KC_REALM="${KEYCLOAK_REALM:-globusdei}"
KC_ADMIN="${KEYCLOAK_ADMIN:-admin2}"
KC_ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-Admin@2024}"
NEW_FLOW="google-auto-link"

# ── Wait for Keycloak ─────────────────────────────────────────────────────────
echo "[keycloak-config] Waiting for Keycloak..."
RETRIES=40
until curl -sf -o /dev/null "${KC_URL}/realms/${KC_REALM}" || [ "$RETRIES" -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  echo "[keycloak-config] Not ready ($RETRIES retries left)..."
  sleep 5
done
[ "$RETRIES" -eq 0 ] && echo "[keycloak-config] ERROR: Keycloak timeout." && exit 1

# ── Admin Token ────────────────────────────────────────────────────────────────
echo "[keycloak-config] Getting admin token..."
TOKEN=$(curl -sf \
  -X POST "${KC_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli&grant_type=password&username=${KC_ADMIN}&password=${KC_ADMIN_PASS}" \
  | sed 's/.*"access_token":"\([^"]*\)".*/\1/')
[ -z "$TOKEN" ] && echo "[keycloak-config] ERROR: No admin token." && exit 1

# ── a) Update Google IdP (keep default flow for now) ──────────────────────────
echo "[keycloak-config] (a) Updating Google IdP credentials..."
IDP_BASE='{
  "alias": "google",
  "displayName": "Google",
  "providerId": "google",
  "enabled": true,
  "trustEmail": true,
  "storeToken": false,
  "addReadTokenRoleOnCreate": false,
  "authenticateByDefault": false,
  "linkOnly": false,
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "clientId": "'"${GOOGLE_CLIENT_ID}"'",
    "clientSecret": "'"${GOOGLE_CLIENT_SECRET}"'",
    "defaultScope": "openid email profile",
    "syncMode": "IMPORT",
    "useJwksUrl": "true"
  }
}'
ST=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "${KC_URL}/admin/realms/${KC_REALM}/identity-provider/instances/google" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "${IDP_BASE}")
if [ "$ST" = "404" ]; then
  curl -sf -X POST "${KC_URL}/admin/realms/${KC_REALM}/identity-provider/instances" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "${IDP_BASE}"
  echo "[keycloak-config] Google IdP created (status 201)."
else
  echo "[keycloak-config] Google IdP updated (status ${ST})."
fi

# ── b) Create auto-link flow (copy of first broker login) ─────────────────────
echo "[keycloak-config] (b) Creating '${NEW_FLOW}' flow..."
COPY_ST=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${KC_URL}/admin/realms/${KC_REALM}/authentication/flows/first%20broker%20login/copy" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
  -d "{\"newName\": \"${NEW_FLOW}\"}")
if [ "$COPY_ST" = "201" ]; then
  echo "[keycloak-config] Flow created."
elif [ "$COPY_ST" = "409" ]; then
  echo "[keycloak-config] Flow already exists."
else
  echo "[keycloak-config] WARNING: Could not create flow (status ${COPY_ST}). Skipping auto-link config."
fi

# ── c) Disable confirm-link and review-profile in the new flow ─────────────────
echo "[keycloak-config] (c) Disabling confirmation steps..."
EXECUTIONS=$(curl -sf \
  "${KC_URL}/admin/realms/${KC_REALM}/authentication/flows/${NEW_FLOW}/executions" \
  -H "Authorization: Bearer ${TOKEN}")

# Split JSON array into one object per line by replacing },{ with newline
EXEC_LINES=$(echo "$EXECUTIONS" | sed 's/},{/}\n{/g')

disable_exec() {
  PROVIDER="$1"
  OBJ=$(echo "$EXEC_LINES" | grep "\"${PROVIDER}\"")
  if [ -z "$OBJ" ]; then
    echo "[keycloak-config] Provider ${PROVIDER} not found in executions."
    return
  fi
  # Replace only the first occurrence of "requirement":"..." to avoid hitting requirementChoices
  UPDATED=$(echo "$OBJ" | sed 's/"requirement":"[^"]*"/"requirement":"DISABLED"/')
  UPD_ST=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PUT "${KC_URL}/admin/realms/${KC_REALM}/authentication/flows/${NEW_FLOW}/executions" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    -d "${UPDATED}")
  echo "[keycloak-config] ${PROVIDER} → DISABLED (status ${UPD_ST})."
}

disable_exec "idp-confirm-link"
disable_exec "idp-review-profile"

# ── d) Switch Google IdP to use the new auto-link flow ────────────────────────
echo "[keycloak-config] (d) Switching Google IdP to '${NEW_FLOW}' flow..."
IDP_FINAL='{
  "alias": "google",
  "displayName": "Google",
  "providerId": "google",
  "enabled": true,
  "trustEmail": true,
  "storeToken": false,
  "addReadTokenRoleOnCreate": false,
  "authenticateByDefault": false,
  "linkOnly": false,
  "firstBrokerLoginFlowAlias": "'"${NEW_FLOW}"'",
  "config": {
    "clientId": "'"${GOOGLE_CLIENT_ID}"'",
    "clientSecret": "'"${GOOGLE_CLIENT_SECRET}"'",
    "defaultScope": "openid email profile",
    "syncMode": "IMPORT",
    "useJwksUrl": "true"
  }
}'
FINAL_ST=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "${KC_URL}/admin/realms/${KC_REALM}/identity-provider/instances/google" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "${IDP_FINAL}")
echo "[keycloak-config] IdP flow updated (status ${FINAL_ST})."

echo "[keycloak-config] Done. Google login will now auto-link accounts — no confirmation page."
