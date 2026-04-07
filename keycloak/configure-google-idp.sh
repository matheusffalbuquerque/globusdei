#!/bin/sh
# configure-google-idp.sh
# Injects real Google OAuth credentials into Keycloak via the Admin REST API.
# Runs as a sidecar after Keycloak is healthy.
set -e

KC_URL="${KEYCLOAK_URL:-http://keycloak:8080}"
KC_REALM="${KEYCLOAK_REALM:-globusdei}"
KC_ADMIN="${KEYCLOAK_ADMIN:-admin2}"
KC_ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-Admin@2024}"

echo "[keycloak-config] Waiting for Keycloak to be ready..."
RETRIES=30
until curl -sf -o /dev/null "${KC_URL}/realms/${KC_REALM}" || [ "$RETRIES" -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  echo "[keycloak-config] Not ready ($RETRIES retries left)..."
  sleep 5
done

if [ "$RETRIES" -eq 0 ]; then
  echo "[keycloak-config] ERROR: Keycloak did not become ready."
  exit 1
fi

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
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "clientId": "'"${GOOGLE_CLIENT_ID}"'",
    "clientSecret": "'"${GOOGLE_CLIENT_SECRET}"'",
    "defaultScope": "openid email profile",
    "syncMode": "IMPORT",
    "useJwksUrl": "true"
  }
}'

echo "[keycloak-config] Updating Google IdP with real credentials..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "${KC_URL}/admin/realms/${KC_REALM}/identity-provider/instances/google" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${IDP_PAYLOAD}")

if [ "$HTTP_STATUS" = "204" ]; then
  echo "[keycloak-config] Google IdP updated successfully."
elif [ "$HTTP_STATUS" = "404" ]; then
  echo "[keycloak-config] IdP not found, creating..."
  curl -sf -X POST "${KC_URL}/admin/realms/${KC_REALM}/identity-provider/instances" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${IDP_PAYLOAD}" && echo "[keycloak-config] Google IdP created."
else
  echo "[keycloak-config] ERROR: Unexpected status ${HTTP_STATUS}"
  exit 1
fi

echo "[keycloak-config] Done. Google social login is active."
