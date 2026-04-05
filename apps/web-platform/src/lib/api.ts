export type ServiceName = 'main' | 'finance';

type SessionLike = {
  accessToken?: string;
  user?: {
    email?: string | null;
    name?: string | null;
    realmRoles?: string[];
  };
};

type ApiFetchOptions = RequestInit & {
  service?: ServiceName;
  session?: SessionLike | null;
};

export function getServiceUrl(service: ServiceName): string {
  if (service === 'finance') {
    return process.env.NEXT_PUBLIC_FINANCE_SERVICE_URL ?? 'http://localhost:3002/api';
  }

  return process.env.NEXT_PUBLIC_MAIN_SERVICE_URL ?? 'http://localhost:3001/api';
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { service = 'main', session, headers, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && init.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (session?.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${session.accessToken}`);
  } else if (session?.user?.email) {
    requestHeaders.set('x-dev-user-sub', session.user.email);
    requestHeaders.set('x-dev-user-email', session.user.email);
    requestHeaders.set('x-dev-user-name', session.user.name ?? session.user.email);
    requestHeaders.set(
      'x-dev-user-roles',
      (session.user.realmRoles ?? []).join(','),
    );
  }

  const response = await fetch(`${getServiceUrl(service)}${path}`, {
    ...init,
    headers: requestHeaders,
  });

  if (!response.ok) {
    let message = 'Request failed.';
    try {
      const payload = await response.json();
      message = payload.message ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
