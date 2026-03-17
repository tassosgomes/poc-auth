import type { MicrofrontendCatalogItem, PermissionSnapshot } from '@zcorp/shared-contracts';

export interface RoutePresentation {
  route: string;
  title: string;
  summary: string;
}

const ROUTE_PRESENTATION: Record<string, Omit<RoutePresentation, 'route'>> = {
  '/dashboard': {
    title: 'Dashboard operacional',
    summary: 'Panorama da sessao, roles efetivas e modulos autorizados pelo BFF.'
  },
  '/ordens': {
    title: 'Ordens de servico',
    summary: 'Ponto de entrada para o microfrontend de ordens autorizado para a sessao atual.'
  },
  '/relatorios': {
    title: 'Relatorios',
    summary: 'Acesso protegido ao modulo de relatorios liberado para as roles vigentes.'
  },
  '/admin/acessos': {
    title: 'Administracao de acessos',
    summary: 'Tela reservada a configuracao dinamica de acessos por role.'
  }
};

function normalizeRoute(route: string): string {
  if (route === '/') {
    return route;
  }

  return route.replace(/\/+$/, '') || '/';
}

function humanizeRoute(route: string): string {
  return route
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[-_]/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ');
}

export function isAuthorizedRoute(pathname: string, routes: readonly string[]): boolean {
  const normalizedPath = normalizeRoute(pathname);
  return routes.some((route) => normalizeRoute(route) === normalizedPath);
}

export function getFirstAuthorizedRoute(snapshot: PermissionSnapshot): string | null {
  return snapshot.routes[0] ?? null;
}

export function describeRoute(route: string): RoutePresentation {
  const normalizedRoute = normalizeRoute(route);
  const presentation = ROUTE_PRESENTATION[normalizedRoute];

  if (presentation) {
    return {
      route: normalizedRoute,
      ...presentation
    };
  }

  return {
    route: normalizedRoute,
    title: humanizeRoute(normalizedRoute),
    summary: 'Rota autorizada pelo BFF para esta sessao.'
  };
}

export function buildNavigation(snapshot: PermissionSnapshot): RoutePresentation[] {
  return snapshot.routes.map((route) => describeRoute(route));
}

export function findMicrofrontend(snapshot: PermissionSnapshot, route: string): MicrofrontendCatalogItem | null {
  const normalizedRoute = normalizeRoute(route);
  return snapshot.microfrontends.find((item) => normalizeRoute(item.route) === normalizedRoute) ?? null;
}