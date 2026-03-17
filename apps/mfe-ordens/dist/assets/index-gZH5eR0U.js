import './index.cjs-D5pJY2em.js';
import './runtimeInit-D29Z5Gu8.js';
import { M as MICROFRONTEND_CATALOG_SEED, a as client, j as jsxRuntimeExports, O as OrdensRemoteApp } from './styles-NWaG2Y4J.js';
import { R as React } from './mfeOrdens__loadShare__react__loadShare__.mjs-M32OvxXF.js';
import './mfeOrdens__loadShare__react_mf_2_dom__loadShare__.mjs_commonjs-proxy-CXqeT3Zc.js';
import './mfeOrdens__loadShare__react_mf_2_dom__loadShare__.mjs-ClybNRcp.js';
import './mfeOrdens__loadShare__react__loadShare__.mjs_commonjs-proxy-BsRahnUC.js';

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
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(OrdensRemoteApp, { snapshot: PERMISSION_SNAPSHOT_FIXTURE }) })
);
