const globalKey = "__mf_init____mf__virtual/mfeOrdens__mf_v__runtimeInit__mf_v__.js__";
if (!globalThis[globalKey]) {
  let initResolve, initReject;
  const initPromise = new Promise((re, rj) => {
    initResolve = re;
    initReject = rj;
  });
  globalThis[globalKey] = {
    initPromise,
    initResolve,
    initReject,
  };
  // In SSR (no window), resolve immediately with a stub runtime
  // so modules don't hang waiting for browser-only init
  if (typeof window === 'undefined') {
    initResolve({
      loadRemote: function() { return Promise.resolve(undefined); },
      loadShare: function() { return Promise.resolve(undefined); },
    });
  }
}
const { initPromise, initResolve, initReject } = globalThis[globalKey];

export { initResolve as a, initPromise as i };
