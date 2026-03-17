import './index.cjs-D5pJY2em.js';
import './runtimeInit-Be4zBD5u.js';
import { M as MICROFRONTEND_CATALOG_SEED, a as client, j as jsxRuntimeExports, D as DashboardRemoteApp } from './styles-CRA941So.js';
import { R as React } from './mfeDashboard__loadShare__react__loadShare__.mjs-C5k4YCSZ.js';
import './mfeDashboard__loadShare__react_mf_2_dom__loadShare__.mjs_commonjs-proxy-Cdlg6YB6.js';
import './mfeDashboard__loadShare__react_mf_2_dom__loadShare__.mjs-DUiOgoMg.js';
import './mfeDashboard__loadShare__react__loadShare__.mjs_commonjs-proxy-DUiSnSQx.js';

const PERMISSION_SNAPSHOT_FIXTURE = {
    userId: 'user-123',
    roles: ['admin'],
    permissions: ['dashboard:view', 'ordens:view', 'relatorios:view', 'role-access:manage'],
    screens: ['dashboard', 'ordens', 'relatorios', 'admin-acessos'],
    routes: ['/dashboard', '/ordens', '/relatorios', '/admin/acessos'],
    microfrontends: MICROFRONTEND_CATALOG_SEED,
    generatedAt: '2026-03-17T00:00:00.000Z',
    version: 1
};

client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardRemoteApp, { snapshot: PERMISSION_SNAPSHOT_FIXTURE }) })
);
