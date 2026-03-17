import { c as createRoot, j as jsxRuntimeExports, A as AdminAcessosRemoteApp, M as MICROFRONTEND_CATALOG_SEED } from './styles-LV2ba4RF.js';
import { _ as __mf_5 } from './mfeAdminAcessos__loadShare__react__loadShare__.mjs-C6P-fva4.js';
import './mfeAdminAcessos__loadShare__react_mf_2_dom__loadShare__.mjs_commonjs-proxy-BMW0JVVR.js';
import './mfeAdminAcessos__loadShare__react_mf_2_dom__loadShare__.mjs-DmwOrMPf.js';
import './runtimeInit-DCgm9or3.js';
import './mfeAdminAcessos__loadShare__react__loadShare__.mjs_commonjs-proxy-slcnb7yr.js';

const manifest = MICROFRONTEND_CATALOG_SEED.find((item) => item.id === "mfe-admin-acessos");
if (!manifest) {
  throw new Error("Manifesto do mfe-admin-acessos nao encontrado no contrato compartilhado.");
}
async function mount(container, props) {
  const root = createRoot(container);
  root.render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(__mf_5, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminAcessosRemoteApp, { bffBaseUrl: props.bffBaseUrl }) })
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
