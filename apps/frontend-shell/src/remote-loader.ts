import type {
  MicrofrontendCatalogItem,
  PermissionSnapshot,
  RemoteBootstrapModule
} from '@zcorp/shared-contracts';
import { loadRemoteBootstrap } from './federation-runtime';

export class UnauthorizedRemoteError extends Error {
  constructor(message: string, public readonly route: string) {
    super(message);
    this.name = 'UnauthorizedRemoteError';
  }
}

function normalizeRoute(route: string): string {
  if (route === '/') {
    return route;
  }

  return route.replace(/\/+$/, '') || '/';
}

export function resolveAuthorizedRemote(
  snapshot: PermissionSnapshot,
  route: string
): MicrofrontendCatalogItem {
  const normalizedRoute = normalizeRoute(route);
  const remote = snapshot.microfrontends.find((item) => normalizeRoute(item.route) === normalizedRoute);

  if (!remote) {
    throw new UnauthorizedRemoteError('O catalogo autorizado nao contem remoto para a rota solicitada.', normalizedRoute);
  }

  return remote;
}

export async function loadAuthorizedRemote(
  snapshot: PermissionSnapshot,
  route: string
): Promise<RemoteBootstrapModule> {
  const remote = resolveAuthorizedRemote(snapshot, route);

  try {
    return await loadRemoteBootstrap(remote);
  } catch (error) {
    if (error instanceof UnauthorizedRemoteError) {
      throw error;
    }

    throw new UnauthorizedRemoteError(
      'O shell recusou a carga do remoto porque o runtime autorizado nao conseguiu resolve-lo exclusivamente pelo catalogo do BFF.',
      route
    );
  }
}