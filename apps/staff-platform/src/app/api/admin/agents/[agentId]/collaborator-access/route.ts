import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '../../../../auth/[...nextauth]/route';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8085';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'globusdei';
const KEYCLOAK_ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
const KEYCLOAK_ADMIN_USERNAME = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin2';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'Admin@2024';
const MAIN_SERVICE_URL = process.env.NEXT_PUBLIC_MAIN_SERVICE_URL || 'http://localhost:3001/api';

/**
 * Obtains a Keycloak admin token to manage realm role mappings.
 */
async function getAdminToken(): Promise<string> {
  const response = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: KEYCLOAK_ADMIN_CLIENT_ID,
      username: KEYCLOAK_ADMIN_USERNAME,
      password: KEYCLOAK_ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao obter token administrativo do Keycloak: ${response.status} - ${body}`);
  }

  const payload = await response.json();
  return payload.access_token as string;
}

/**
 * Fetches the realm role representation expected by Keycloak role-mapping endpoints.
 */
async function getRealmRole(adminToken: string, roleName: string): Promise<{ id: string; name: string }> {
  const response = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles/${encodeURIComponent(roleName)}`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Role '${roleName}' não encontrada no Keycloak: ${response.status} - ${body}`);
  }

  return response.json();
}

/**
 * Adds realm roles to the informed Keycloak user.
 */
async function assignRealmRoles(
  adminToken: string,
  userId: string,
  roles: Array<{ id: string; name: string }>,
): Promise<void> {
  const response = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roles),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao atribuir realm role: ${response.status} - ${body}`);
  }
}

/**
 * Removes realm roles from the informed Keycloak user.
 */
async function removeRealmRoles(
  adminToken: string,
  userId: string,
  roles: Array<{ id: string; name: string }>,
): Promise<void> {
  const response = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roles),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao remover realm role: ${response.status} - ${body}`);
  }
}

/**
 * Confirms the caller is an authenticated local ADMIN before changing collaborator access.
 */
async function assertAdminAccess(accessToken?: string) {
  if (!accessToken) {
    throw new Error('Sessão sem access token para validar permissões administrativas.');
  }

  const response = await fetch(`${MAIN_SERVICE_URL}/collaborators/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Não foi possível validar o perfil administrativo: ${response.status} - ${body}`);
  }

  const collaborator = await response.json();
  const roles = Array.isArray(collaborator?.roles) ? collaborator.roles : [];
  if (!roles.includes('ADMIN')) {
    throw new Error('Apenas administradores podem alterar o acesso de colaboradores.');
  }
}

/**
 * Enables or disables the Keycloak realm role that unlocks the collaborator portal.
 * The route parameter must be the Keycloak subject (`authSubject`) of the target user.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as { accessToken?: string } | null)?.accessToken;
    await assertAdminAccess(accessToken);

    const body = (await request.json()) as { enabled?: boolean };
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'O campo enabled é obrigatório.' },
        { status: 400 },
      );
    }

    const { agentId: authSubject } = await context.params;
    if (!authSubject) {
      return NextResponse.json({ error: 'Agente inválido.' }, { status: 400 });
    }

    const adminToken = await getAdminToken();
    const collaboratorRole = await getRealmRole(adminToken, 'colaborador');

    if (enabled) {
      await assignRealmRoles(adminToken, authSubject, [collaboratorRole]);
    } else {
      await removeRealmRoles(adminToken, authSubject, [collaboratorRole]);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Falha ao sincronizar acesso de colaborador.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
