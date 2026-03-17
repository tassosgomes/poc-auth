import type { MicrofrontendCatalogItem, RoleAccessConfig } from './contracts.js';

export const MICROFRONTEND_CATALOG_SEED: MicrofrontendCatalogItem[] = [
  {
    id: 'mfe-dashboard',
    route: '/dashboard',
    entry: 'https://dashboard-authpoc.tasso.dev.br/remoteEntry.js',
    scope: 'mfeDashboard',
    module: './bootstrap',
    requiredPermissions: ['dashboard:view']
  },
  {
    id: 'mfe-ordens',
    route: '/ordens',
    entry: 'https://ordens-authpoc.tasso.dev.br/remoteEntry.js',
    scope: 'mfeOrdens',
    module: './bootstrap',
    requiredPermissions: ['ordens:view']
  },
  {
    id: 'mfe-relatorios',
    route: '/relatorios',
    entry: 'https://relatorios-authpoc.tasso.dev.br/remoteEntry.js',
    scope: 'mfeRelatorios',
    module: './bootstrap',
    requiredPermissions: ['relatorios:view']
  },
  {
    id: 'mfe-admin-acessos',
    route: '/admin/acessos',
    entry: 'https://admin-authpoc.tasso.dev.br/remoteEntry.js',
    scope: 'mfeAdminAcessos',
    module: './bootstrap',
    requiredPermissions: ['role-access:manage']
  }
];

export const ROLE_ACCESS_SEED: RoleAccessConfig[] = [
  {
    role: 'admin',
    permissions: ['dashboard:view', 'ordens:view', 'ordens:create', 'relatorios:view', 'role-access:manage'],
    screens: ['dashboard', 'ordens', 'relatorios', 'admin-acessos'],
    routes: ['/dashboard', '/ordens', '/relatorios', '/admin/acessos'],
    microfrontends: ['mfe-dashboard', 'mfe-ordens', 'mfe-relatorios', 'mfe-admin-acessos'],
    updatedAt: '2026-03-17T00:00:00.000Z',
    updatedBy: 'seed:task-1.0',
    version: 1
  },
  {
    role: 'coordenador',
    permissions: ['dashboard:view', 'ordens:view', 'ordens:create', 'relatorios:view'],
    screens: ['dashboard', 'ordens', 'relatorios'],
    routes: ['/dashboard', '/ordens', '/relatorios'],
    microfrontends: ['mfe-dashboard', 'mfe-ordens', 'mfe-relatorios'],
    updatedAt: '2026-03-17T00:00:00.000Z',
    updatedBy: 'seed:task-1.0',
    version: 1
  },
  {
    role: 'tecnico',
    permissions: ['dashboard:view', 'ordens:view', 'relatorios:view'],
    screens: ['dashboard', 'ordens', 'relatorios'],
    routes: ['/dashboard', '/ordens', '/relatorios'],
    microfrontends: ['mfe-dashboard', 'mfe-ordens', 'mfe-relatorios'],
    updatedAt: '2026-03-17T00:00:00.000Z',
    updatedBy: 'seed:task-1.0',
    version: 1
  }
];
