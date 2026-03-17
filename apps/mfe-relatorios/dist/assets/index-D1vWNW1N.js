import './index.cjs-D5pJY2em.js';
import './runtimeInit-DxKjMyLP.js';
import { M as MICROFRONTEND_CATALOG_SEED, a as client, j as jsxRuntimeExports, R as RelatoriosRemoteApp } from './styles-BORSMSiD.js';
import { R as React } from './mfeRelatorios__loadShare__react__loadShare__.mjs-D5A9QHRK.js';
import './mfeRelatorios__loadShare__react_mf_2_dom__loadShare__.mjs_commonjs-proxy-C_YjakiJ.js';
import './mfeRelatorios__loadShare__react_mf_2_dom__loadShare__.mjs-DNQ67VJH.js';
import './mfeRelatorios__loadShare__react__loadShare__.mjs_commonjs-proxy-D3NqE1-D.js';

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
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(RelatoriosRemoteApp, { snapshot: PERMISSION_SNAPSHOT_FIXTURE }) })
);
