import {
  BffErrorEnvelopeSchema,
  PermissionSnapshotSchema,
  RoleAccessConfigListSchema,
  RoleAccessConfigSchema,
  RoleAccessMutationSchema,
  type BffErrorEnvelope,
  type PermissionSnapshot,
  type RoleAccessConfig,
  type RoleAccessMutation
} from '@zcorp/shared-contracts';

const DEFAULT_BFF_BASE_URL = 'https://api-authpoc.tasso.dev.br';

function normalizeBaseUrl(value: string | undefined): string {
  return (value ?? DEFAULT_BFF_BASE_URL).replace(/\/$/, '');
}

function buildCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

async function requestBff(pathname: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  headers.set('accept', 'application/json');

  if (!headers.has('x-correlation-id')) {
    headers.set('x-correlation-id', buildCorrelationId());
  }

  try {
    return await fetch(`${getBffBaseUrl()}${pathname}`, {
      credentials: 'include',
      ...init,
      headers
    });
  } catch (error) {
    throw new BffClientError('Nao foi possivel comunicar com o BFF.', 503, 'UPSTREAM_ERROR', undefined, {
      cause: error
    });
  }
}

export class BffClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly envelope?: BffErrorEnvelope,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = 'BffClientError';
  }
}

export function getBffBaseUrl(): string {
  return normalizeBaseUrl(import.meta.env.VITE_BFF_BASE_URL);
}

export function getLoginUrl(): string {
  return `${getBffBaseUrl()}/api/auth/login`;
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const loginUrl = getLoginUrl();

  try {
    window.location.assign(loginUrl);
  } catch {
    window.location.href = loginUrl;
  }
}

async function toBffClientError(response: Response): Promise<BffClientError> {
  const payload = await readJson(response);
  const parsedEnvelope = BffErrorEnvelopeSchema.safeParse(payload);

  if (parsedEnvelope.success) {
    return new BffClientError(
      parsedEnvelope.data.message,
      parsedEnvelope.data.status,
      parsedEnvelope.data.code,
      parsedEnvelope.data
    );
  }

  return new BffClientError('Falha ao processar a resposta do BFF.', response.status, 'UPSTREAM_ERROR');
}

export async function getPermissionSnapshot(): Promise<PermissionSnapshot> {
  const response = await requestBff('/api/permissions');

  if (!response.ok) {
    throw await toBffClientError(response);
  }

  const payload = await readJson(response);
  return PermissionSnapshotSchema.parse(payload);
}

export async function getRoleAccessMatrix(): Promise<RoleAccessConfig[]> {
  const response = await requestBff('/api/admin/role-access');

  if (!response.ok) {
    throw await toBffClientError(response);
  }

  return RoleAccessConfigListSchema.parse(await readJson(response));
}

export async function updateRoleAccess(role: string, payload: RoleAccessMutation): Promise<RoleAccessConfig> {
  const normalizedPayload = RoleAccessMutationSchema.parse(payload);
  const response = await requestBff(`/api/admin/role-access/${role}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(normalizedPayload)
  });

  if (!response.ok) {
    throw await toBffClientError(response);
  }

  return RoleAccessConfigSchema.parse(await readJson(response));
}