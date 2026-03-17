import type { MicrofrontendCatalogItem, RoleAccessConfig } from './contracts.js';

export const MICROFRONTEND_CATALOG_SEED: MicrofrontendCatalogItem[] = [
  {
    id: 'dashboard',
    route: '/dashboard',
    entry: 'https://dashboard-authpoc.tasso.dev.br/remoteEntry.js',
    scope: 'dashboardMfe',
    module: './App',
    requiredPermissions: ['dashboard:view']
  },
  {
    id: 'ordens',
    route: '/ordens',
    entry: 'https://ordens-authpoc.tasso.dev.br/remoteEntry.js',
    scope: 'ordensMfe',
    module: './App',
    requiredPermissions: ['ordens:view']
  },
  {
    id: 'relatorios',
    route: '/relatorios',
    entry: 'https://relatorios-authpoc.tasso.dev.br/remoteEntry.js',
    scope: 'relatoriosMfe',
    module: './App',
    requiredPermissions: ['relatorios:view']
  },
  {
    id: 'admin-acessos',
    route: '/admin/acessos',
    entry: 'https://admin-authpoc.tasso.dev.br/remoteEntry.js',
    scope: 'adminAcessosMfe',
    module: './App',
    requiredPermissions: ['role-access:manage']
  }
];

export const ROLE_ACCESS_SEED: RoleAccessConfig[] = [
  {
    role: 'admin',
    permissions: ['dashboard:view', 'ordens:view', 'relatorios:view', 'role-access:manage'],
    screens: ['dashboard', 'ordens', 'relatorios', 'admin-acessos'],
    routes: ['/dashboard', '/ordens', '/relatorios', '/admin/acessos'],
    microfrontends: ['dashboard', 'ordens', 'relatorios', 'admin-acessos'],
    updatedAt: '2026-03-17T00:00:00.000Z',
    updatedBy: 'seed:task-1.0',
    version: 1
  },
  {
    role: 'coordenador',
    permissions: ['dashboard:view', 'ordens:view', 'relatorios:view'],
    screens: ['dashboard', 'ordens', 'relatorios'],
    routes: ['/dashboard', '/ordens', '/relatorios'],
    microfrontends: ['dashboard', 'ordens', 'relatorios'],
    updatedAt: '2026-03-17T00:00:00.000Z',
    updatedBy: 'seed:task-1.0',
    version: 1
  },
  {
    role: 'tecnico',
    permissions: ['dashboard:view', 'ordens:view', 'relatorios:view'],
    screens: ['dashboard', 'ordens', 'relatorios'],
    routes: ['/dashboard', '/ordens', '/relatorios'],
    microfrontends: ['dashboard', 'ordens', 'relatorios'],
    updatedAt: '2026-03-17T00:00:00.000Z',
    updatedBy: 'seed:task-1.0',
    version: 1
  }
];
