import { c as createRoot, j as jsxRuntimeExports, D as DashboardRemoteApp, M as MICROFRONTEND_CATALOG_SEED } from './styles-CRA941So.js';
import { _ as __mf_5 } from './mfeDashboard__loadShare__react__loadShare__.mjs-C5k4YCSZ.js';
import './mfeDashboard__loadShare__react_mf_2_dom__loadShare__.mjs_commonjs-proxy-Cdlg6YB6.js';
import './mfeDashboard__loadShare__react_mf_2_dom__loadShare__.mjs-DUiOgoMg.js';
import './runtimeInit-Be4zBD5u.js';
import './mfeDashboard__loadShare__react__loadShare__.mjs_commonjs-proxy-DUiSnSQx.js';

const manifest = MICROFRONTEND_CATALOG_SEED.find((item) => item.id === "mfe-dashboard");
if (!manifest) {
  throw new Error("Manifesto do mfe-dashboard nao encontrado no contrato compartilhado.");
}
async function mount(container, props) {
  const root = createRoot(container);
  root.render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(__mf_5, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardRemoteApp, { snapshot: props.snapshot }) })
  );
  return () => {
    root.unmount();
  };
}
const bootstrap = {
  manifest,
  mount
};

export { bootstrap as default, manifest, mount };
