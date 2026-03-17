import { c as createRoot, j as jsxRuntimeExports, O as OrdensRemoteApp, M as MICROFRONTEND_CATALOG_SEED } from './styles-NWaG2Y4J.js';
import { _ as __mf_5 } from './mfeOrdens__loadShare__react__loadShare__.mjs-M32OvxXF.js';
import './mfeOrdens__loadShare__react_mf_2_dom__loadShare__.mjs_commonjs-proxy-CXqeT3Zc.js';
import './mfeOrdens__loadShare__react_mf_2_dom__loadShare__.mjs-ClybNRcp.js';
import './runtimeInit-D29Z5Gu8.js';
import './mfeOrdens__loadShare__react__loadShare__.mjs_commonjs-proxy-BsRahnUC.js';

const manifest = MICROFRONTEND_CATALOG_SEED.find((item) => item.id === "mfe-ordens");
if (!manifest) {
  throw new Error("Manifesto do mfe-ordens nao encontrado no contrato compartilhado.");
}
async function mount(container, props) {
  const root = createRoot(container);
  root.render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(__mf_5, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(OrdensRemoteApp, { snapshot: props.snapshot }) })
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
