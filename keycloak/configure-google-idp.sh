#!/bin/sh
# configure-google-idp.sh
# Injects real Google OAuth credentials into Keycloak via the Admin REST API
# and configures auto-linking of existing accounts by email (no confirmation page).
set -e

KC_URL="${KEYCLOAK_URL:-http://keycloak:8080}"
KC_REALM="${KEYCLOAK_REALM:-globusdei}"
KC_ADMIN="${KEYCLOAK_ADMIN:-admin2}"
KC_ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-Admin@2024}"
FLOW_ALIAS="google-auto-link"

# ── Wait for Keycloak ─────────────────────────────────────────────────────────
echo "[keycloak-config] Waiting for Keycloak to be ready..."
RETRIES=40
until curl -sf -o /dev/null "${KC_URL}/realms/${KC_REALM}" || [ "$RETRIES" -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  echo "[keycloak-config] Not ready ($RETRIES retries left)..."
  sleep 5
done
if [ "$RETRIES" -eq 0 ]; then
  echo "[keycloak-config] ERROR: Keycloak did not become ready."
  exit 1
fi

# ── Get Admin Token ────────────────────────────────────────────────────────────
echo "[keycloak-config] Getting admin token..."
TOKEN=$(curl -sf \
  -X POST "${KC_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli&grant_type=password&username=${KC_ADMIN}&password=${KC_ADMIN_PASS}" \
  | sed 's/.*"access_token":"\([^"]*\)".*/\1/')

if [ -z "$TOKEN" ]; then
  echo "[keycloak-config] ERROR: Could not obtain admin token."
  exit 1
fi

# ── Configure Google IdP ───────────────────────────────────────────────────────
echo "[keycloak-config] Configuring Google Identity Provider..."

IDP_PAYLOAD='{
  "alias": "google",
  "displayName": "Google",
  "providerId": "google",
  "enabled": true,
  "trustEmail": true,
  "storeToken": false,
  "addReadTokenRoleOnCreate": false,
  "authenticateByDefault": false,
  "linkOnly": false,
  "firstBrokerLoginFlowAlias": "'"${FLOW_ALIAS}"'",
  "config": {
    "clientId": "'"${GOOGLE_CLIENT_ID}"'",
    "clientSecret": "'"${GOOGLE_CLIENT_SECRET}"'",
    "defaultScope": "openid email profile",
    "syncMode": "IMPORT",
    "useJwksUrl": "true"
  }
}'

# PUT (update) or POST (create) the IdP
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "${KC_URL}/admin/realms/${KC_REALM}/identity-provider/instances/google" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${IDP_PAYLOAD}")

if [ "$HTTP_STATUS" = "204" ]; then
  echo "[keycloak-config] Google IdP updated."
elif [ "$HTTP_STATUS" = "404" ]; then
  curl -sf -X POST "${KC_URL}/admin/realms/${KC_REALM}/identity-provider/instances" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${IDP_PAYLOAD}" && echo "[keycloak-config] Google IdP created."
else
  echo "[keycloak-config] ERROR: Unexpected status ${HTTP_STATUS} updating IdP."
  exit 1
fi

# ── Create Auto-Link First Broker Login Flow ───────────────────────────────────
# This eliminates the "Account already exists" confirmation page.
echo "[keycloak-config] Setting up auto-link flow (no 'Account already exists' page)..."

# Check if the flow already exists
FLOW_EXISTS=$(curl -sf "${KC_URL}/admin/realms/${KC_REALM}/authentication/flows" \
  -H "Authorization: Bearer ${TOKEN}" \
  | tr '{' '\n' | grep "\"${FLOW_ALIAS}\"" | wc -l | tr -d ' ')

if [ "$FLOW_EXISTS" = "0" ]; then
  echo "[keycloak-config] Copying first broker login flow..."
  COPY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${KC_URL}/admin/realms/${KC_REALM}/authentication/flows/first%20broker%20login/copy" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"newName\": \"${FLOW_ALIAS}\"}")

  if [ "$COPY_STATUS" != "201" ] && [ "$COPY_STATUS" != "409" ]; then
    echo "[keycloak-config] WARNING: Could not copy flow (status ${COPY_STATUS}). Using default flow."
    exit 0
  fi
  echo "[keycloak-config] Flow '${FLOW_ALIAS}' created."
else
  echo "[keycloak-config] Flow '${FLOW_ALIAS}' already exists."
fi

# Get all executions of the new flow
EXECUTIONS=$(curl -sf \
  "${KC_URL}/admin/realms/${KC_REALM}/authentication/flows/${FLOW_ALIAS}/executions" \
  -H "Authorization: Bearer ${TOKEN}")

# Find and disable "Confirm Link Existing Account" (idp-confirm-link)
CONFIRM_EXEC=$(echo "$EXECUTIONS" | tr '{' '\n' | grep '"idp-confirm-link"')
if [ -n "$CONFIRM_EXEC" ]; then
  UPDATED_EXEC="{$(echo "$CONFIRM_EXEC" | sed 's/"requirement":"[^"]*"/"requirement":"DISABLED"/')}"
  EXEC_UPDATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PUT "${KC_URL}/admin/realms/${KC_REALM}/authentication/flows/${FLOW_ALIAS}/executions" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${UPDATED_EXEC}")
  echo "[keycloak-config] Confirm Link step disabled (status ${EXEC_UPDATE_STATUS})."
fi

# Find and disable "Review Profile" step (idp-review-profile) — skip name review page too
REVIEW_EXEC=$(echo "$EXECUTIONS" | tr '{' '\n' | grep '"idp-review-profile"')
if [ -n "$REVIEW_EXEC" ]; then
  UPDATED_REVIEW="{$(echo "$REVIEW_EXEC" | sed 's/"requirement":"[^"]*"/"requirement":"DISABLED"/')}"
  curl -s -o /dev/null -w "%{http_code}" \
    -X PUT "${KC_URL}/admin/realms/${KC_REALM}/authentication/flows/${FLOW_ALIAS}/executions" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${UPDATED_REVIEW}" > /dev/null
  echo "[keycloak-config] Review Profile step disabled."
fi

echo "[keycloak-config] Done. Google login will now auto-link existing accounts by email."
