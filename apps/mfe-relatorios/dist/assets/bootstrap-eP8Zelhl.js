import { c as createRoot, j as jsxRuntimeExports, R as RelatoriosRemoteApp, M as MICROFRONTEND_CATALOG_SEED } from './styles-BORSMSiD.js';
import { _ as __mf_5 } from './mfeRelatorios__loadShare__react__loadShare__.mjs-D5A9QHRK.js';
import './mfeRelatorios__loadShare__react_mf_2_dom__loadShare__.mjs_commonjs-proxy-C_YjakiJ.js';
import './mfeRelatorios__loadShare__react_mf_2_dom__loadShare__.mjs-DNQ67VJH.js';
import './runtimeInit-DxKjMyLP.js';
import './mfeRelatorios__loadShare__react__loadShare__.mjs_commonjs-proxy-D3NqE1-D.js';

const manifest = MICROFRONTEND_CATALOG_SEED.find((item) => item.id === "mfe-relatorios");
if (!manifest) {
  throw new Error("Manifesto do mfe-relatorios nao encontrado no contrato compartilhado.");
}
async function mount(container, props) {
  const root = createRoot(container);
  root.render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(__mf_5, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(RelatoriosRemoteApp, { snapshot: props.snapshot }) })
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
