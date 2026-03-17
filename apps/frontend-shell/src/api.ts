import {
  BffErrorEnvelopeSchema,
  PermissionSnapshotSchema,
  type BffErrorEnvelope,
  type PermissionSnapshot
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
  const headers = new Headers({
    accept: 'application/json'
  });

  if (import.meta.env.VITE_ENABLE_CORRELATION === 'true') {
    headers.set('x-correlation-id', buildCorrelationId());
  }

  let response: Response;
  try {
    response = await fetch(`${getBffBaseUrl()}/api/permissions`, {
      credentials: 'include',
      headers
    });
  } catch (error) {
    throw new BffClientError('Nao foi possivel comunicar com o BFF.', 503, 'UPSTREAM_ERROR', undefined, {
      cause: error
    });
  }

  if (!response.ok) {
    throw await toBffClientError(response);
  }

  const payload = await readJson(response);
  return PermissionSnapshotSchema.parse(payload);
}