import { NextRequest, NextResponse } from 'next/server';

const KEYCLOAK_URL =
  process.env.KEYCLOAK_URL || 'http://localhost:8085';
const KEYCLOAK_REALM =
  process.env.KEYCLOAK_REALM || 'globusdei';
const KEYCLOAK_ADMIN_CLIENT_ID =
  process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
const KEYCLOAK_ADMIN_USERNAME =
  process.env.KEYCLOAK_ADMIN_USERNAME || 'admin2';
const KEYCLOAK_ADMIN_PASSWORD =
  process.env.KEYCLOAK_ADMIN_PASSWORD || 'Admin@2024';

/** Obtém um token de administrador no realm master via password grant. */
async function getAdminToken(): Promise<string> {
  const res = await fetch(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: KEYCLOAK_ADMIN_CLIENT_ID,
        username: KEYCLOAK_ADMIN_USERNAME,
        password: KEYCLOAK_ADMIN_PASSWORD,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao obter token admin: ${res.status} — ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/** Busca o ID e nome de uma realm role pelo nome. */
async function getRealmRole(
  adminToken: string,
  roleName: string,
): Promise<{ id: string; name: string }> {
  const res = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles/${encodeURIComponent(roleName)}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  if (!res.ok) {
    throw new Error(`Role '${roleName}' não encontrada: ${res.status}`);
  }
  return res.json();
}

/** Atribui uma lista de realm roles a um usuário. */
async function assignRealmRoles(
  adminToken: string,
  userId: string,
  roles: { id: string; name: string }[],
): Promise<void> {
  const res = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(roles),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao atribuir roles: ${res.status} — ${text}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    // --- Validações básicas ---
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 },
      );
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // --- Token de admin ---
    const adminToken = await getAdminToken();

    // --- Criar usuário no Keycloak ---
    const createRes = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          username: email,
          email: email,
          firstName,
          lastName,
          enabled: true,
          emailVerified: true,
          credentials: [
            {
              type: 'password',
              value: password,
              temporary: false,
            },
          ],
          attributes: {
            phone: phone ? [phone] : [],
          },
        }),
      },
    );

    if (createRes.status === 409) {
      return NextResponse.json(
        { error: 'Já existe uma conta com esse e-mail.' },
        { status: 409 },
      );
    }

    if (!createRes.ok) {
      const errBody = await createRes.text();
      console.error('[register] Keycloak create user error:', createRes.status, errBody);
      return NextResponse.json(
        { error: 'Erro ao criar conta. Tente novamente.' },
        { status: 500 },
      );
    }

    // Keycloak retorna 201 com header Location: .../users/{id}
    const locationHeader = createRes.headers.get('Location') ?? '';
    const userId = locationHeader.split('/').pop();

    if (!userId) {
      console.error('[register] Não foi possível extrair userId do header Location:', locationHeader);
      // Usuário foi criado mas sem role — ainda retorna sucesso para não bloquear
      return NextResponse.json({ message: 'Conta criada com sucesso!' }, { status: 201 });
    }

    // --- Atribuir role 'agente' ao novo usuário ---
    try {
      const agenteRole = await getRealmRole(adminToken, 'agente');
      await assignRealmRoles(adminToken, userId, [agenteRole]);
      console.log(`[register] Role 'agente' atribuída ao usuário ${userId} (${email})`);
    } catch (roleErr) {
      // Não bloqueia o cadastro se a atribuição de role falhar
      console.error('[register] Falha ao atribuir role agente:', roleErr);
    }

    return NextResponse.json(
      { message: 'Conta criada com sucesso!' },
      { status: 201 },
    );
  } catch (err) {
    console.error('[register] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Erro inesperado. Tente novamente mais tarde.' },
      { status: 500 },
    );
  }
}
