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

const res = initPromise.then(runtime => runtime.loadShare("react", {
      customShareInfo: {shareConfig:{
        singleton: true,
        strictVersion: false,
        requiredVersion: "^18.3.1"
      }}
    }));
    const exportModule = await res.then((factory) => (typeof factory === "function" ? factory() : factory));
    const __moduleExports = exportModule;
const React = exportModule.__esModule ? exportModule.default : exportModule;
    const { Children: __mf_0, Component: __mf_1, Fragment: __mf_2, Profiler: __mf_3, PureComponent: __mf_4, StrictMode: __mf_5, Suspense: __mf_6, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: __mf_7, act: __mf_8, cloneElement: __mf_9, createContext: __mf_10, createElement: __mf_11, createFactory: __mf_12, createRef: __mf_13, forwardRef: __mf_14, isValidElement: __mf_15, lazy: __mf_16, memo: __mf_17, startTransition: __mf_18, unstable_act: __mf_19, useCallback: __mf_20, useContext: __mf_21, useDebugValue: __mf_22, useDeferredValue: __mf_23, useEffect: __mf_24, useId: __mf_25, useImperativeHandle: __mf_26, useInsertionEffect: __mf_27, useLayoutEffect: __mf_28, useMemo: __mf_29, useReducer: __mf_30, useRef: __mf_31, useState: __mf_32, useSyncExternalStore: __mf_33, useTransition: __mf_34, version: __mf_35 } = exportModule;

const mfeAdminAcessos__loadShare__react__loadShare__ = /*#__PURE__*/_mergeNamespaces({
  __proto__: null,
  Children: __mf_0,
  Component: __mf_1,
  Fragment: __mf_2,
  Profiler: __mf_3,
  PureComponent: __mf_4,
  StrictMode: __mf_5,
  Suspense: __mf_6,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: __mf_7,
  act: __mf_8,
  cloneElement: __mf_9,
  createContext: __mf_10,
  createElement: __mf_11,
  createFactory: __mf_12,
  createRef: __mf_13,
  default: React,
  forwardRef: __mf_14,
  isValidElement: __mf_15,
  lazy: __mf_16,
  memo: __mf_17,
  startTransition: __mf_18,
  unstable_act: __mf_19,
  useCallback: __mf_20,
  useContext: __mf_21,
  useDebugValue: __mf_22,
  useDeferredValue: __mf_23,
  useEffect: __mf_24,
  useId: __mf_25,
  useImperativeHandle: __mf_26,
  useInsertionEffect: __mf_27,
  useLayoutEffect: __mf_28,
  useMemo: __mf_29,
  useReducer: __mf_30,
  useRef: __mf_31,
  useState: __mf_32,
  useSyncExternalStore: __mf_33,
  useTransition: __mf_34,
  version: __mf_35
}, [__moduleExports]);

export { React as R, __mf_5 as _, __mf_32 as a, __mf_24 as b, __mf_18 as c, mfeAdminAcessos__loadShare__react__loadShare__ as m };
