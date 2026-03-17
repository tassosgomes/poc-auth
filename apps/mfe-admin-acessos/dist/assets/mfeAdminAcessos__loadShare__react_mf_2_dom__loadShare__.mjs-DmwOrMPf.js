import { i as initPromise } from './runtimeInit-DCgm9or3.js';

function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    const e = m[i];
    if (typeof e !== 'string' && !Array.isArray(e)) { for (const k in e) {
      if (k !== 'default' && !(k in n)) {
        const d = Object.getOwnPropertyDescriptor(e, k);
        if (d) {
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: () => e[k]
          });
        }
      }
    } }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: 'Module' }));
}

const res = initPromise.then(runtime => runtime.loadShare("react-dom", {
      customShareInfo: {shareConfig:{
        singleton: true,
        strictVersion: false,
        requiredVersion: "^18.3.1"
      }}
    }));
    const exportModule = await res.then((factory) => (typeof factory === "function" ? factory() : factory));
    const __moduleExports = exportModule;
const mfeAdminAcessos__loadShare__react_mf_2_dom__loadShare__ = exportModule.__esModule ? exportModule.default : exportModule;
    const { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: __mf_0, createPortal: __mf_1, createRoot: __mf_2, findDOMNode: __mf_3, flushSync: __mf_4, hydrate: __mf_5, hydrateRoot: __mf_6, render: __mf_7, unmountComponentAtNode: __mf_8, unstable_batchedUpdates: __mf_9, unstable_renderSubtreeIntoContainer: __mf_10, version: __mf_11 } = exportModule;

const mfeAdminAcessos__loadShare__react_mf_2_dom__loadShare__$1 = /*#__PURE__*/_mergeNamespaces({
  __proto__: null,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: __mf_0,
  createPortal: __mf_1,
  createRoot: __mf_2,
  default: mfeAdminAcessos__loadShare__react_mf_2_dom__loadShare__,
  findDOMNode: __mf_3,
  flushSync: __mf_4,
  hydrate: __mf_5,
  hydrateRoot: __mf_6,
  render: __mf_7,
  unmountComponentAtNode: __mf_8,
  unstable_batchedUpdates: __mf_9,
  unstable_renderSubtreeIntoContainer: __mf_10,
  version: __mf_11
}, [__moduleExports]);

export { mfeAdminAcessos__loadShare__react_mf_2_dom__loadShare__$1 as m };
