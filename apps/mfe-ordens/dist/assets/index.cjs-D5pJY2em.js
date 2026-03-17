var index_cjs$2 = {};

var index_cjs$1 = {};

var define_process_env_default = {};
const FederationModuleManifest = "federation-manifest.json";
const MANIFEST_EXT = ".json";
const BROWSER_LOG_KEY = "FEDERATION_DEBUG";
const NameTransformSymbol = {
  AT: "@",
  HYPHEN: "-",
  SLASH: "/"
};
const NameTransformMap = {
  [NameTransformSymbol.AT]: "scope_",
  [NameTransformSymbol.HYPHEN]: "_",
  [NameTransformSymbol.SLASH]: "__"
};
const EncodedNameTransformMap = {
  [NameTransformMap[NameTransformSymbol.AT]]: NameTransformSymbol.AT,
  [NameTransformMap[NameTransformSymbol.HYPHEN]]: NameTransformSymbol.HYPHEN,
  [NameTransformMap[NameTransformSymbol.SLASH]]: NameTransformSymbol.SLASH
};
const SEPARATOR = ":";
const ManifestFileName = "mf-manifest.json";
const StatsFileName = "mf-stats.json";
const MFModuleType = {
  NPM: "npm",
  APP: "app"
};
const MODULE_DEVTOOL_IDENTIFIER = "__MF_DEVTOOLS_MODULE_INFO__";
const ENCODE_NAME_PREFIX = "ENCODE_NAME_PREFIX";
const TEMP_DIR = ".federation";
const MFPrefetchCommon = {
  identifier: "MFDataPrefetch",
  globalKey: "__PREFETCH__",
  library: "mf-data-prefetch",
  exportsKey: "__PREFETCH_EXPORTS__",
  fileName: "bootstrap.js"
};
var ContainerPlugin = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
var ContainerReferencePlugin = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
var ModuleFederationPlugin = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
var SharePlugin = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
function isBrowserEnv() {
  return typeof window !== "undefined" && typeof window.document !== "undefined";
}
function isReactNativeEnv() {
  return typeof navigator !== "undefined" && navigator?.product === "ReactNative";
}
function isBrowserDebug() {
  try {
    if (isBrowserEnv() && window.localStorage) {
      return Boolean(localStorage.getItem(BROWSER_LOG_KEY));
    }
  } catch (error2) {
    return false;
  }
  return false;
}
function isDebugMode() {
  if (typeof process !== "undefined" && define_process_env_default && define_process_env_default["FEDERATION_DEBUG"]) {
    return Boolean(define_process_env_default["FEDERATION_DEBUG"]);
  }
  if (typeof FEDERATION_DEBUG !== "undefined" && Boolean(FEDERATION_DEBUG)) {
    return true;
  }
  return isBrowserDebug();
}
const getProcessEnv = function() {
  return typeof process !== "undefined" && define_process_env_default ? define_process_env_default : {};
};
const LOG_CATEGORY$1 = "[ Federation Runtime ]";
const parseEntry = (str, devVerOrUrl, separator = SEPARATOR) => {
  const strSplit = str.split(separator);
  const devVersionOrUrl = getProcessEnv()["NODE_ENV"] === "development" && devVerOrUrl;
  const defaultVersion = "*";
  const isEntry = (s) => s.startsWith("http") || s.includes(MANIFEST_EXT);
  if (strSplit.length >= 2) {
    let [name, ...versionOrEntryArr] = strSplit;
    if (str.startsWith(separator)) {
      name = strSplit.slice(0, 2).join(separator);
      versionOrEntryArr = [
        devVersionOrUrl || strSplit.slice(2).join(separator)
      ];
    }
    let versionOrEntry = devVersionOrUrl || versionOrEntryArr.join(separator);
    if (isEntry(versionOrEntry)) {
      return {
        name,
        entry: versionOrEntry
      };
    } else {
      return {
        name,
        version: versionOrEntry || defaultVersion
      };
    }
  } else if (strSplit.length === 1) {
    const [name] = strSplit;
    if (devVersionOrUrl && isEntry(devVersionOrUrl)) {
      return {
        name,
        entry: devVersionOrUrl
      };
    }
    return {
      name,
      version: devVersionOrUrl || defaultVersion
    };
  } else {
    throw `Invalid entry value: ${str}`;
  }
};
const composeKeyWithSeparator = function(...args) {
  if (!args.length) {
    return "";
  }
  return args.reduce((sum, cur) => {
    if (!cur) {
      return sum;
    }
    if (!sum) {
      return cur;
    }
    return `${sum}${SEPARATOR}${cur}`;
  }, "");
};
const encodeName = function(name, prefix = "", withExt = false) {
  try {
    const ext = withExt ? ".js" : "";
    return `${prefix}${name.replace(new RegExp(`${NameTransformSymbol.AT}`, "g"), NameTransformMap[NameTransformSymbol.AT]).replace(new RegExp(`${NameTransformSymbol.HYPHEN}`, "g"), NameTransformMap[NameTransformSymbol.HYPHEN]).replace(new RegExp(`${NameTransformSymbol.SLASH}`, "g"), NameTransformMap[NameTransformSymbol.SLASH])}${ext}`;
  } catch (err) {
    throw err;
  }
};
const decodeName = function(name, prefix, withExt) {
  try {
    let decodedName = name;
    if (prefix) {
      if (!decodedName.startsWith(prefix)) {
        return decodedName;
      }
      decodedName = decodedName.replace(new RegExp(prefix, "g"), "");
    }
    decodedName = decodedName.replace(new RegExp(`${NameTransformMap[NameTransformSymbol.AT]}`, "g"), EncodedNameTransformMap[NameTransformMap[NameTransformSymbol.AT]]).replace(new RegExp(`${NameTransformMap[NameTransformSymbol.SLASH]}`, "g"), EncodedNameTransformMap[NameTransformMap[NameTransformSymbol.SLASH]]).replace(new RegExp(`${NameTransformMap[NameTransformSymbol.HYPHEN]}`, "g"), EncodedNameTransformMap[NameTransformMap[NameTransformSymbol.HYPHEN]]);
    if (withExt) {
      decodedName = decodedName.replace(".js", "");
    }
    return decodedName;
  } catch (err) {
    throw err;
  }
};
const generateExposeFilename = (exposeName, withExt) => {
  if (!exposeName) {
    return "";
  }
  let expose = exposeName;
  if (expose === ".") {
    expose = "default_export";
  }
  if (expose.startsWith("./")) {
    expose = expose.replace("./", "");
  }
  return encodeName(expose, "__federation_expose_", withExt);
};
const generateShareFilename = (pkgName, withExt) => {
  if (!pkgName) {
    return "";
  }
  return encodeName(pkgName, "__federation_shared_", withExt);
};
const getResourceUrl = (module, sourceUrl) => {
  if ("getPublicPath" in module) {
    let publicPath;
    if (!module.getPublicPath.startsWith("function")) {
      publicPath = new Function(module.getPublicPath)();
    } else {
      publicPath = new Function("return " + module.getPublicPath)()();
    }
    return `${publicPath}${sourceUrl}`;
  } else if ("publicPath" in module) {
    if (!isBrowserEnv() && !isReactNativeEnv() && "ssrPublicPath" in module) {
      return `${module.ssrPublicPath}${sourceUrl}`;
    }
    return `${module.publicPath}${sourceUrl}`;
  } else {
    console.warn("Cannot get resource URL. If in debug mode, please ignore.", module, sourceUrl);
    return "";
  }
};
const assert$1 = (condition, msg) => {
  if (!condition) {
    error$1(msg);
  }
};
const error$1 = (msg) => {
  throw new Error(`${LOG_CATEGORY$1}: ${msg}`);
};
const warn$1 = (msg) => {
  console.warn(`${LOG_CATEGORY$1}: ${msg}`);
};
function safeToString(info) {
  try {
    return JSON.stringify(info, null, 2);
  } catch (e) {
    return "";
  }
}
const VERSION_PATTERN_REGEXP = /^([\d^=v<>~]|[*xX]$)/;
function isRequiredVersion(str) {
  return VERSION_PATTERN_REGEXP.test(str);
}
const simpleJoinRemoteEntry = (rPath, rName) => {
  if (!rPath) {
    return rName;
  }
  const transformPath = (str) => {
    if (str === ".") {
      return "";
    }
    if (str.startsWith("./")) {
      return str.replace("./", "");
    }
    if (str.startsWith("/")) {
      const strWithoutSlash = str.slice(1);
      if (strWithoutSlash.endsWith("/")) {
        return strWithoutSlash.slice(0, -1);
      }
      return strWithoutSlash;
    }
    return str;
  };
  const transformedPath = transformPath(rPath);
  if (!transformedPath) {
    return rName;
  }
  if (transformedPath.endsWith("/")) {
    return `${transformedPath}${rName}`;
  }
  return `${transformedPath}/${rName}`;
};
function inferAutoPublicPath(url2) {
  return url2.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
}
function generateSnapshotFromManifest(manifest, options = {}) {
  const { remotes = {}, overrides = {}, version } = options;
  let remoteSnapshot;
  const getPublicPath = () => {
    if ("publicPath" in manifest.metaData) {
      if (manifest.metaData.publicPath === "auto" && version) {
        return inferAutoPublicPath(version);
      }
      return manifest.metaData.publicPath;
    } else {
      return manifest.metaData.getPublicPath;
    }
  };
  const overridesKeys = Object.keys(overrides);
  let remotesInfo = {};
  if (!Object.keys(remotes).length) {
    remotesInfo = manifest.remotes?.reduce((res2, next) => {
      let matchedVersion;
      const name = next.federationContainerName;
      if (overridesKeys.includes(name)) {
        matchedVersion = overrides[name];
      } else {
        if ("version" in next) {
          matchedVersion = next.version;
        } else {
          matchedVersion = next.entry;
        }
      }
      res2[name] = {
        matchedVersion
      };
      return res2;
    }, {}) || {};
  }
  Object.keys(remotes).forEach((key) => remotesInfo[key] = {
    // overrides will override dependencies
    matchedVersion: overridesKeys.includes(key) ? overrides[key] : remotes[key]
  });
  const { remoteEntry: { path: remoteEntryPath, name: remoteEntryName, type: remoteEntryType }, types: remoteTypes = { path: "", name: "", zip: "", api: "" }, buildInfo: { buildVersion }, globalName, ssrRemoteEntry } = manifest.metaData;
  const { exposes } = manifest;
  let basicRemoteSnapshot = {
    version: version ? version : "",
    buildVersion,
    globalName,
    remoteEntry: simpleJoinRemoteEntry(remoteEntryPath, remoteEntryName),
    remoteEntryType,
    remoteTypes: simpleJoinRemoteEntry(remoteTypes.path, remoteTypes.name),
    remoteTypesZip: remoteTypes.zip || "",
    remoteTypesAPI: remoteTypes.api || "",
    remotesInfo,
    shared: manifest?.shared.map((item) => ({
      assets: item.assets,
      sharedName: item.name,
      version: item.version,
      // @ts-ignore
      usedExports: item.referenceExports || []
    })),
    modules: exposes?.map((expose) => ({
      moduleName: expose.name,
      modulePath: expose.path,
      assets: expose.assets
    }))
  };
  if (manifest.metaData?.prefetchInterface) {
    const prefetchInterface = manifest.metaData.prefetchInterface;
    basicRemoteSnapshot = {
      ...basicRemoteSnapshot,
      prefetchInterface
    };
  }
  if (manifest.metaData?.prefetchEntry) {
    const { path: path2, name, type } = manifest.metaData.prefetchEntry;
    basicRemoteSnapshot = {
      ...basicRemoteSnapshot,
      prefetchEntry: simpleJoinRemoteEntry(path2, name),
      prefetchEntryType: type
    };
  }
  if ("publicPath" in manifest.metaData) {
    remoteSnapshot = {
      ...basicRemoteSnapshot,
      publicPath: getPublicPath(),
      ssrPublicPath: manifest.metaData.ssrPublicPath
    };
  } else {
    remoteSnapshot = {
      ...basicRemoteSnapshot,
      getPublicPath: getPublicPath()
    };
  }
  if (ssrRemoteEntry) {
    const fullSSRRemoteEntry = simpleJoinRemoteEntry(ssrRemoteEntry.path, ssrRemoteEntry.name);
    remoteSnapshot.ssrRemoteEntry = fullSSRRemoteEntry;
    remoteSnapshot.ssrRemoteEntryType = ssrRemoteEntry.type || "commonjs-module";
  }
  return remoteSnapshot;
}
function isManifestProvider(moduleInfo) {
  if ("remoteEntry" in moduleInfo && moduleInfo.remoteEntry.includes(MANIFEST_EXT)) {
    return true;
  } else {
    return false;
  }
}
function getManifestFileName(manifestOptions) {
  if (!manifestOptions) {
    return {
      statsFileName: StatsFileName,
      manifestFileName: ManifestFileName
    };
  }
  let filePath = typeof manifestOptions === "boolean" ? "" : manifestOptions.filePath || "";
  let fileName = typeof manifestOptions === "boolean" ? "" : manifestOptions.fileName || "";
  const JSON_EXT = ".json";
  const addExt = (name) => {
    if (name.endsWith(JSON_EXT)) {
      return name;
    }
    return `${name}${JSON_EXT}`;
  };
  const insertSuffix = (name, suffix) => {
    return name.replace(JSON_EXT, `${suffix}${JSON_EXT}`);
  };
  const manifestFileName = fileName ? addExt(fileName) : ManifestFileName;
  const statsFileName = fileName ? insertSuffix(manifestFileName, "-stats") : StatsFileName;
  return {
    statsFileName: simpleJoinRemoteEntry(filePath, statsFileName),
    manifestFileName: simpleJoinRemoteEntry(filePath, manifestFileName)
  };
}
const PREFIX = "[ Module Federation ]";
const DEFAULT_DELEGATE = console;
const LOGGER_STACK_SKIP_TOKENS = [
  "logger.ts",
  "logger.js",
  "captureStackTrace",
  "Logger.emit",
  "Logger.log",
  "Logger.info",
  "Logger.warn",
  "Logger.error",
  "Logger.debug"
];
function captureStackTrace() {
  try {
    const stack = new Error().stack;
    if (!stack) {
      return void 0;
    }
    const [, ...rawLines] = stack.split("\n");
    const filtered = rawLines.filter((line) => !LOGGER_STACK_SKIP_TOKENS.some((token) => line.includes(token)));
    if (!filtered.length) {
      return void 0;
    }
    const stackPreview = filtered.slice(0, 5).join("\n");
    return `Stack trace:
${stackPreview}`;
  } catch {
    return void 0;
  }
}
class Logger {
  constructor(prefix, delegate = DEFAULT_DELEGATE) {
    this.prefix = prefix;
    this.delegate = delegate ?? DEFAULT_DELEGATE;
  }
  setPrefix(prefix) {
    this.prefix = prefix;
  }
  setDelegate(delegate) {
    this.delegate = delegate ?? DEFAULT_DELEGATE;
  }
  emit(method, args) {
    const delegate = this.delegate;
    const debugMode = isDebugMode();
    const stackTrace = debugMode ? captureStackTrace() : void 0;
    const enrichedArgs = stackTrace ? [...args, stackTrace] : args;
    const order = (() => {
      switch (method) {
        case "log":
          return ["log", "info"];
        case "info":
          return ["info", "log"];
        case "warn":
          return ["warn", "info", "log"];
        case "error":
          return ["error", "warn", "log"];
        case "debug":
        default:
          return ["debug", "log"];
      }
    })();
    for (const candidate of order) {
      const handler = delegate[candidate];
      if (typeof handler === "function") {
        handler.call(delegate, this.prefix, ...enrichedArgs);
        return;
      }
    }
    for (const candidate of order) {
      const handler = DEFAULT_DELEGATE[candidate];
      if (typeof handler === "function") {
        handler.call(DEFAULT_DELEGATE, this.prefix, ...enrichedArgs);
        return;
      }
    }
  }
  log(...args) {
    this.emit("log", args);
  }
  warn(...args) {
    this.emit("warn", args);
  }
  error(...args) {
    this.emit("error", args);
  }
  success(...args) {
    this.emit("info", args);
  }
  info(...args) {
    this.emit("info", args);
  }
  ready(...args) {
    this.emit("info", args);
  }
  debug(...args) {
    if (isDebugMode()) {
      this.emit("debug", args);
    }
  }
}
function createLogger(prefix) {
  return new Logger(prefix);
}
function createInfrastructureLogger(prefix) {
  const infrastructureLogger2 = new Logger(prefix);
  Object.defineProperty(infrastructureLogger2, "__mf_infrastructure_logger__", {
    value: true,
    enumerable: false,
    configurable: false
  });
  return infrastructureLogger2;
}
function bindLoggerToCompiler(loggerInstance, compiler, name) {
  if (!loggerInstance.__mf_infrastructure_logger__) {
    return;
  }
  if (!compiler?.getInfrastructureLogger) {
    return;
  }
  try {
    const infrastructureLogger2 = compiler.getInfrastructureLogger(name);
    if (infrastructureLogger2 && typeof infrastructureLogger2 === "object" && (typeof infrastructureLogger2.log === "function" || typeof infrastructureLogger2.info === "function" || typeof infrastructureLogger2.warn === "function" || typeof infrastructureLogger2.error === "function")) {
      loggerInstance.setDelegate(infrastructureLogger2);
    }
  } catch {
    loggerInstance.setDelegate(void 0);
  }
}
const logger$1 = createLogger(PREFIX);
const infrastructureLogger = createInfrastructureLogger(PREFIX);
async function safeWrapper$1(callback, disableWarn) {
  try {
    const res2 = await callback();
    return res2;
  } catch (e) {
    !disableWarn && warn$1(e);
    return;
  }
}
function isStaticResourcesEqual$1(url1, url2) {
  const REG_EXP = /^(https?:)?\/\//i;
  const relativeUrl1 = url1.replace(REG_EXP, "").replace(/\/$/, "");
  const relativeUrl2 = url2.replace(REG_EXP, "").replace(/\/$/, "");
  return relativeUrl1 === relativeUrl2;
}
function createScript(info) {
  let script2 = null;
  let needAttach = true;
  let timeout = 2e4;
  let timeoutId;
  const scripts = document.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    const s = scripts[i];
    const scriptSrc = s.getAttribute("src");
    if (scriptSrc && isStaticResourcesEqual$1(scriptSrc, info.url)) {
      script2 = s;
      needAttach = false;
      break;
    }
  }
  if (!script2) {
    const attrs2 = info.attrs;
    script2 = document.createElement("script");
    script2.type = attrs2?.["type"] === "module" ? "module" : "text/javascript";
    let createScriptRes = void 0;
    if (info.createScriptHook) {
      createScriptRes = info.createScriptHook(info.url, info.attrs);
      if (createScriptRes instanceof HTMLScriptElement) {
        script2 = createScriptRes;
      } else if (typeof createScriptRes === "object") {
        if ("script" in createScriptRes && createScriptRes.script) {
          script2 = createScriptRes.script;
        }
        if ("timeout" in createScriptRes && createScriptRes.timeout) {
          timeout = createScriptRes.timeout;
        }
      }
    }
    if (!script2.src) {
      script2.src = info.url;
    }
    if (attrs2 && !createScriptRes) {
      Object.keys(attrs2).forEach((name) => {
        if (script2) {
          if (name === "async" || name === "defer") {
            script2[name] = attrs2[name];
          } else if (!script2.getAttribute(name)) {
            script2.setAttribute(name, attrs2[name]);
          }
        }
      });
    }
  }
  const onScriptComplete = async (prev, event) => {
    clearTimeout(timeoutId);
    const onScriptCompleteCallback = () => {
      if (event?.type === "error") {
        info?.onErrorCallback && info?.onErrorCallback(event);
      } else {
        info?.cb && info?.cb();
      }
    };
    if (script2) {
      script2.onerror = null;
      script2.onload = null;
      safeWrapper$1(() => {
        const { needDeleteScript = true } = info;
        if (needDeleteScript) {
          script2?.parentNode && script2.parentNode.removeChild(script2);
        }
      });
      if (prev && typeof prev === "function") {
        const result = prev(event);
        if (result instanceof Promise) {
          const res2 = await result;
          onScriptCompleteCallback();
          return res2;
        }
        onScriptCompleteCallback();
        return result;
      }
    }
    onScriptCompleteCallback();
  };
  script2.onerror = onScriptComplete.bind(null, script2.onerror);
  script2.onload = onScriptComplete.bind(null, script2.onload);
  timeoutId = setTimeout(() => {
    onScriptComplete(null, new Error(`Remote script "${info.url}" time-outed.`));
  }, timeout);
  return { script: script2, needAttach };
}
function createLink(info) {
  let link = null;
  let needAttach = true;
  const links = document.getElementsByTagName("link");
  for (let i = 0; i < links.length; i++) {
    const l = links[i];
    const linkHref = l.getAttribute("href");
    const linkRel = l.getAttribute("rel");
    if (linkHref && isStaticResourcesEqual$1(linkHref, info.url) && linkRel === info.attrs["rel"]) {
      link = l;
      needAttach = false;
      break;
    }
  }
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("href", info.url);
    let createLinkRes = void 0;
    const attrs2 = info.attrs;
    if (info.createLinkHook) {
      createLinkRes = info.createLinkHook(info.url, attrs2);
      if (createLinkRes instanceof HTMLLinkElement) {
        link = createLinkRes;
      }
    }
    if (attrs2 && !createLinkRes) {
      Object.keys(attrs2).forEach((name) => {
        if (link && !link.getAttribute(name)) {
          link.setAttribute(name, attrs2[name]);
        }
      });
    }
  }
  const onLinkComplete = (prev, event) => {
    const onLinkCompleteCallback = () => {
      if (event?.type === "error") {
        info?.onErrorCallback && info?.onErrorCallback(event);
      } else {
        info?.cb && info?.cb();
      }
    };
    if (link) {
      link.onerror = null;
      link.onload = null;
      safeWrapper$1(() => {
        const { needDeleteLink = true } = info;
        if (needDeleteLink) {
          link?.parentNode && link.parentNode.removeChild(link);
        }
      });
      if (prev) {
        const res2 = prev(event);
        onLinkCompleteCallback();
        return res2;
      }
    }
    onLinkCompleteCallback();
  };
  link.onerror = onLinkComplete.bind(null, link.onerror);
  link.onload = onLinkComplete.bind(null, link.onload);
  return { link, needAttach };
}
function loadScript(url2, info) {
  const { attrs: attrs2 = {}, createScriptHook } = info;
  return new Promise((resolve, reject) => {
    const { script: script2, needAttach } = createScript({
      url: url2,
      cb: resolve,
      onErrorCallback: reject,
      attrs: {
        fetchpriority: "high",
        ...attrs2
      },
      createScriptHook,
      needDeleteScript: true
    });
    needAttach && document.head.appendChild(script2);
  });
}
const createScriptNode = (url2, cb2, attrs2, loaderHook2) => {
  cb2(new Error("createScriptNode is disabled in non-Node.js environment"));
};
const loadScriptNode = (url2, info) => {
  throw new Error("loadScriptNode is disabled in non-Node.js environment");
};
function normalizeOptions(enableDefault, defaultOptions, key) {
  return function(options) {
    if (options === false) {
      return false;
    }
    if (typeof options === "undefined") {
      if (enableDefault) {
        return defaultOptions;
      } else {
        return false;
      }
    }
    if (options === true) {
      return defaultOptions;
    }
    if (options && typeof options === "object") {
      return {
        ...defaultOptions,
        ...options
      };
    }
    throw new Error(`Unexpected type for \`${key}\`, expect boolean/undefined/object, got: ${typeof options}`);
  };
}
const createModuleFederationConfig = (options) => {
  return options;
};
index_cjs$1.BROWSER_LOG_KEY = BROWSER_LOG_KEY;
index_cjs$1.ENCODE_NAME_PREFIX = ENCODE_NAME_PREFIX;
index_cjs$1.EncodedNameTransformMap = EncodedNameTransformMap;
index_cjs$1.FederationModuleManifest = FederationModuleManifest;
index_cjs$1.MANIFEST_EXT = MANIFEST_EXT;
index_cjs$1.MFModuleType = MFModuleType;
index_cjs$1.MFPrefetchCommon = MFPrefetchCommon;
index_cjs$1.MODULE_DEVTOOL_IDENTIFIER = MODULE_DEVTOOL_IDENTIFIER;
index_cjs$1.ManifestFileName = ManifestFileName;
index_cjs$1.NameTransformMap = NameTransformMap;
index_cjs$1.NameTransformSymbol = NameTransformSymbol;
index_cjs$1.SEPARATOR = SEPARATOR;
index_cjs$1.StatsFileName = StatsFileName;
index_cjs$1.TEMP_DIR = TEMP_DIR;
index_cjs$1.assert = assert$1;
index_cjs$1.bindLoggerToCompiler = bindLoggerToCompiler;
index_cjs$1.composeKeyWithSeparator = composeKeyWithSeparator;
index_cjs$1.containerPlugin = ContainerPlugin;
index_cjs$1.containerReferencePlugin = ContainerReferencePlugin;
index_cjs$1.createInfrastructureLogger = createInfrastructureLogger;
index_cjs$1.createLink = createLink;
index_cjs$1.createLogger = createLogger;
index_cjs$1.createModuleFederationConfig = createModuleFederationConfig;
index_cjs$1.createScript = createScript;
index_cjs$1.createScriptNode = createScriptNode;
index_cjs$1.decodeName = decodeName;
index_cjs$1.encodeName = encodeName;
index_cjs$1.error = error$1;
index_cjs$1.generateExposeFilename = generateExposeFilename;
index_cjs$1.generateShareFilename = generateShareFilename;
index_cjs$1.generateSnapshotFromManifest = generateSnapshotFromManifest;
index_cjs$1.getManifestFileName = getManifestFileName;
index_cjs$1.getProcessEnv = getProcessEnv;
index_cjs$1.getResourceUrl = getResourceUrl;
index_cjs$1.inferAutoPublicPath = inferAutoPublicPath;
index_cjs$1.infrastructureLogger = infrastructureLogger;
index_cjs$1.isBrowserEnv = isBrowserEnv;
index_cjs$1.isDebugMode = isDebugMode;
index_cjs$1.isManifestProvider = isManifestProvider;
index_cjs$1.isReactNativeEnv = isReactNativeEnv;
index_cjs$1.isRequiredVersion = isRequiredVersion;
index_cjs$1.isStaticResourcesEqual = isStaticResourcesEqual$1;
index_cjs$1.loadScript = loadScript;
index_cjs$1.loadScriptNode = loadScriptNode;
index_cjs$1.logger = logger$1;
index_cjs$1.moduleFederationPlugin = ModuleFederationPlugin;
index_cjs$1.normalizeOptions = normalizeOptions;
index_cjs$1.parseEntry = parseEntry;
index_cjs$1.safeToString = safeToString;
index_cjs$1.safeWrapper = safeWrapper$1;
index_cjs$1.sharePlugin = SharePlugin;
index_cjs$1.simpleJoinRemoteEntry = simpleJoinRemoteEntry;
index_cjs$1.warn = warn$1;

var index_cjs = {};

const RUNTIME_001 = 'RUNTIME-001';
const RUNTIME_002 = 'RUNTIME-002';
const RUNTIME_003 = 'RUNTIME-003';
const RUNTIME_004 = 'RUNTIME-004';
const RUNTIME_005 = 'RUNTIME-005';
const RUNTIME_006 = 'RUNTIME-006';
const RUNTIME_007 = 'RUNTIME-007';
const RUNTIME_008 = 'RUNTIME-008';
const RUNTIME_009 = 'RUNTIME-009';
const TYPE_001 = 'TYPE-001';
const BUILD_001 = 'BUILD-001';
const BUILD_002 = 'BUILD-002';

const getDocsUrl = (errorCode) => {
    const type = errorCode.split('-')[0].toLowerCase();
    return `View the docs to see how to solve: https://module-federation.io/guide/troubleshooting/${type}#${errorCode.toLowerCase()}`;
};
const getShortErrorMsg = (errorCode, errorDescMap, args, originalErrorMsg) => {
    const msg = [`${[errorDescMap[errorCode]]} #${errorCode}`];
    args && msg.push(`args: ${JSON.stringify(args)}`);
    msg.push(getDocsUrl(errorCode));
    originalErrorMsg && msg.push(`Original Error Message:\n ${originalErrorMsg}`);
    return msg.join('\n');
};

const runtimeDescMap = {
    [RUNTIME_001]: 'Failed to get remoteEntry exports.',
    [RUNTIME_002]: 'The remote entry interface does not contain "init"',
    [RUNTIME_003]: 'Failed to get manifest.',
    [RUNTIME_004]: 'Failed to locate remote.',
    [RUNTIME_005]: 'Invalid loadShareSync function call from bundler runtime',
    [RUNTIME_006]: 'Invalid loadShareSync function call from runtime',
    [RUNTIME_007]: 'Failed to get remote snapshot.',
    [RUNTIME_008]: 'Failed to load script resources.',
    [RUNTIME_009]: 'Please call createInstance first.',
};
const typeDescMap = {
    [TYPE_001]: 'Failed to generate type declaration. Execute the below cmd to reproduce and fix the error.',
};
const buildDescMap = {
    [BUILD_001]: 'Failed to find expose module.',
    [BUILD_002]: 'PublicPath is required in prod mode.',
};
const errorDescMap = {
    ...runtimeDescMap,
    ...typeDescMap,
    ...buildDescMap,
};

index_cjs.BUILD_001 = BUILD_001;
index_cjs.BUILD_002 = BUILD_002;
index_cjs.RUNTIME_001 = RUNTIME_001;
index_cjs.RUNTIME_002 = RUNTIME_002;
index_cjs.RUNTIME_003 = RUNTIME_003;
index_cjs.RUNTIME_004 = RUNTIME_004;
index_cjs.RUNTIME_005 = RUNTIME_005;
index_cjs.RUNTIME_006 = RUNTIME_006;
index_cjs.RUNTIME_007 = RUNTIME_007;
index_cjs.RUNTIME_008 = RUNTIME_008;
index_cjs.RUNTIME_009 = RUNTIME_009;
index_cjs.TYPE_001 = TYPE_001;
index_cjs.buildDescMap = buildDescMap;
index_cjs.errorDescMap = errorDescMap;
index_cjs.getShortErrorMsg = getShortErrorMsg;
index_cjs.runtimeDescMap = runtimeDescMap;
index_cjs.typeDescMap = typeDescMap;

var sdk = index_cjs$1;
var errorCodes = index_cjs;
const LOG_CATEGORY = "[ Federation Runtime ]";
const logger = sdk.createLogger(LOG_CATEGORY);
function assert(condition, msg) {
  if (!condition) {
    error(msg);
  }
}
function error(msg) {
  if (msg instanceof Error) {
    if (!msg.message.startsWith(LOG_CATEGORY)) {
      msg.message = `${LOG_CATEGORY}: ${msg.message}`;
    }
    throw msg;
  }
  throw new Error(`${LOG_CATEGORY}: ${msg}`);
}
function warn(msg) {
  if (msg instanceof Error) {
    if (!msg.message.startsWith(LOG_CATEGORY)) {
      msg.message = `${LOG_CATEGORY}: ${msg.message}`;
    }
    logger.warn(msg);
  } else {
    logger.warn(msg);
  }
}
function addUniqueItem(arr, item) {
  if (arr.findIndex((name) => name === item) === -1) {
    arr.push(item);
  }
  return arr;
}
function getFMId(remoteInfo) {
  if ("version" in remoteInfo && remoteInfo.version) {
    return `${remoteInfo.name}:${remoteInfo.version}`;
  } else if ("entry" in remoteInfo && remoteInfo.entry) {
    return `${remoteInfo.name}:${remoteInfo.entry}`;
  } else {
    return `${remoteInfo.name}`;
  }
}
function isRemoteInfoWithEntry(remote) {
  return typeof remote.entry !== "undefined";
}
function isPureRemoteEntry(remote) {
  return !remote.entry.includes(".json");
}
async function safeWrapper(callback, disableWarn) {
  try {
    const res = await callback();
    return res;
  } catch (e) {
    !disableWarn && warn(e);
    return;
  }
}
function isObject(val) {
  return val && typeof val === "object";
}
const objectToString = Object.prototype.toString;
function isPlainObject(val) {
  return objectToString.call(val) === "[object Object]";
}
function isStaticResourcesEqual(url1, url2) {
  const REG_EXP = /^(https?:)?\/\//i;
  const relativeUrl1 = url1.replace(REG_EXP, "").replace(/\/$/, "");
  const relativeUrl2 = url2.replace(REG_EXP, "").replace(/\/$/, "");
  return relativeUrl1 === relativeUrl2;
}
function arrayOptions(options) {
  return Array.isArray(options) ? options : [options];
}
function getRemoteEntryInfoFromSnapshot(snapshot) {
  const defaultRemoteEntryInfo = {
    url: "",
    type: "global",
    globalName: ""
  };
  if (sdk.isBrowserEnv() || sdk.isReactNativeEnv() || !("ssrRemoteEntry" in snapshot)) {
    return "remoteEntry" in snapshot ? {
      url: snapshot.remoteEntry,
      type: snapshot.remoteEntryType,
      globalName: snapshot.globalName
    } : defaultRemoteEntryInfo;
  }
  if ("ssrRemoteEntry" in snapshot) {
    return {
      url: snapshot.ssrRemoteEntry || defaultRemoteEntryInfo.url,
      type: snapshot.ssrRemoteEntryType || defaultRemoteEntryInfo.type,
      globalName: snapshot.globalName
    };
  }
  return defaultRemoteEntryInfo;
}
const processModuleAlias = (name, subPath) => {
  let moduleName;
  if (name.endsWith("/")) {
    moduleName = name.slice(0, -1);
  } else {
    moduleName = name;
  }
  if (subPath.startsWith(".")) {
    subPath = subPath.slice(1);
  }
  moduleName = moduleName + subPath;
  return moduleName;
};
const CurrentGlobal = typeof globalThis === "object" ? globalThis : window;
const nativeGlobal = (() => {
  try {
    return document.defaultView;
  } catch {
    return CurrentGlobal;
  }
})();
const Global = nativeGlobal;
function definePropertyGlobalVal(target, key, val) {
  Object.defineProperty(target, key, {
    value: val,
    configurable: false,
    writable: true
  });
}
function includeOwnProperty(target, key) {
  return Object.hasOwnProperty.call(target, key);
}
if (!includeOwnProperty(CurrentGlobal, "__GLOBAL_LOADING_REMOTE_ENTRY__")) {
  definePropertyGlobalVal(CurrentGlobal, "__GLOBAL_LOADING_REMOTE_ENTRY__", {});
}
const globalLoading = CurrentGlobal.__GLOBAL_LOADING_REMOTE_ENTRY__;
function setGlobalDefaultVal(target) {
  if (includeOwnProperty(target, "__VMOK__") && !includeOwnProperty(target, "__FEDERATION__")) {
    definePropertyGlobalVal(target, "__FEDERATION__", target.__VMOK__);
  }
  if (!includeOwnProperty(target, "__FEDERATION__")) {
    definePropertyGlobalVal(target, "__FEDERATION__", {
      __GLOBAL_PLUGIN__: [],
      __INSTANCES__: [],
      moduleInfo: {},
      __SHARE__: {},
      __MANIFEST_LOADING__: {},
      __PRELOADED_MAP__: /* @__PURE__ */ new Map()
    });
    definePropertyGlobalVal(target, "__VMOK__", target.__FEDERATION__);
  }
  target.__FEDERATION__.__GLOBAL_PLUGIN__ ??= [];
  target.__FEDERATION__.__INSTANCES__ ??= [];
  target.__FEDERATION__.moduleInfo ??= {};
  target.__FEDERATION__.__SHARE__ ??= {};
  target.__FEDERATION__.__MANIFEST_LOADING__ ??= {};
  target.__FEDERATION__.__PRELOADED_MAP__ ??= /* @__PURE__ */ new Map();
}
setGlobalDefaultVal(CurrentGlobal);
setGlobalDefaultVal(nativeGlobal);
function resetFederationGlobalInfo() {
  CurrentGlobal.__FEDERATION__.__GLOBAL_PLUGIN__ = [];
  CurrentGlobal.__FEDERATION__.__INSTANCES__ = [];
  CurrentGlobal.__FEDERATION__.moduleInfo = {};
  CurrentGlobal.__FEDERATION__.__SHARE__ = {};
  CurrentGlobal.__FEDERATION__.__MANIFEST_LOADING__ = {};
  Object.keys(globalLoading).forEach((key) => {
    delete globalLoading[key];
  });
}
function setGlobalFederationInstance(FederationInstance) {
  CurrentGlobal.__FEDERATION__.__INSTANCES__.push(FederationInstance);
}
function getGlobalFederationConstructor() {
  return CurrentGlobal.__FEDERATION__.__DEBUG_CONSTRUCTOR__;
}
function setGlobalFederationConstructor(FederationConstructor, isDebug = sdk.isDebugMode()) {
  if (isDebug) {
    CurrentGlobal.__FEDERATION__.__DEBUG_CONSTRUCTOR__ = FederationConstructor;
    CurrentGlobal.__FEDERATION__.__DEBUG_CONSTRUCTOR_VERSION__ = "2.0.1";
  }
}
function getInfoWithoutType(target, key) {
  if (typeof key === "string") {
    const keyRes = target[key];
    if (keyRes) {
      return {
        value: target[key],
        key
      };
    } else {
      const targetKeys = Object.keys(target);
      for (const targetKey of targetKeys) {
        const [targetTypeOrName, _] = targetKey.split(":");
        const nKey = `${targetTypeOrName}:${key}`;
        const typeWithKeyRes = target[nKey];
        if (typeWithKeyRes) {
          return {
            value: typeWithKeyRes,
            key: nKey
          };
        }
      }
      return {
        value: void 0,
        key
      };
    }
  } else {
    throw new Error("key must be string");
  }
}
const getGlobalSnapshot = () => nativeGlobal.__FEDERATION__.moduleInfo;
const getTargetSnapshotInfoByModuleInfo = (moduleInfo, snapshot) => {
  const moduleKey = getFMId(moduleInfo);
  const getModuleInfo = getInfoWithoutType(snapshot, moduleKey).value;
  if (getModuleInfo && !getModuleInfo.version && "version" in moduleInfo && moduleInfo["version"]) {
    getModuleInfo.version = moduleInfo["version"];
  }
  if (getModuleInfo) {
    return getModuleInfo;
  }
  if ("version" in moduleInfo && moduleInfo["version"]) {
    const { version, ...resModuleInfo } = moduleInfo;
    const moduleKeyWithoutVersion = getFMId(resModuleInfo);
    const getModuleInfoWithoutVersion = getInfoWithoutType(nativeGlobal.__FEDERATION__.moduleInfo, moduleKeyWithoutVersion).value;
    if (getModuleInfoWithoutVersion?.version === version) {
      return getModuleInfoWithoutVersion;
    }
  }
  return;
};
const getGlobalSnapshotInfoByModuleInfo = (moduleInfo) => getTargetSnapshotInfoByModuleInfo(moduleInfo, nativeGlobal.__FEDERATION__.moduleInfo);
const setGlobalSnapshotInfoByModuleInfo = (remoteInfo, moduleDetailInfo) => {
  const moduleKey = getFMId(remoteInfo);
  nativeGlobal.__FEDERATION__.moduleInfo[moduleKey] = moduleDetailInfo;
  return nativeGlobal.__FEDERATION__.moduleInfo;
};
const addGlobalSnapshot = (moduleInfos) => {
  nativeGlobal.__FEDERATION__.moduleInfo = {
    ...nativeGlobal.__FEDERATION__.moduleInfo,
    ...moduleInfos
  };
  return () => {
    const keys = Object.keys(moduleInfos);
    for (const key of keys) {
      delete nativeGlobal.__FEDERATION__.moduleInfo[key];
    }
  };
};
const getRemoteEntryExports = (name, globalName) => {
  const remoteEntryKey = globalName || `__FEDERATION_${name}:custom__`;
  const entryExports = CurrentGlobal[remoteEntryKey];
  return {
    remoteEntryKey,
    entryExports
  };
};
const registerGlobalPlugins = (plugins) => {
  const { __GLOBAL_PLUGIN__ } = nativeGlobal.__FEDERATION__;
  plugins.forEach((plugin) => {
    if (__GLOBAL_PLUGIN__.findIndex((p) => p.name === plugin.name) === -1) {
      __GLOBAL_PLUGIN__.push(plugin);
    } else {
      warn(`The plugin ${plugin.name} has been registered.`);
    }
  });
};
const getGlobalHostPlugins = () => nativeGlobal.__FEDERATION__.__GLOBAL_PLUGIN__;
const getPreloaded = (id) => CurrentGlobal.__FEDERATION__.__PRELOADED_MAP__.get(id);
const setPreloaded = (id) => CurrentGlobal.__FEDERATION__.__PRELOADED_MAP__.set(id, true);
const DEFAULT_SCOPE = "default";
const DEFAULT_REMOTE_TYPE = "global";
const buildIdentifier = "[0-9A-Za-z-]+";
const build = `(?:\\+(${buildIdentifier}(?:\\.${buildIdentifier})*))`;
const numericIdentifier = "0|[1-9]\\d*";
const numericIdentifierLoose = "[0-9]+";
const nonNumericIdentifier = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";
const preReleaseIdentifierLoose = `(?:${numericIdentifierLoose}|${nonNumericIdentifier})`;
const preReleaseLoose = `(?:-?(${preReleaseIdentifierLoose}(?:\\.${preReleaseIdentifierLoose})*))`;
const preReleaseIdentifier = `(?:${numericIdentifier}|${nonNumericIdentifier})`;
const preRelease = `(?:-(${preReleaseIdentifier}(?:\\.${preReleaseIdentifier})*))`;
const xRangeIdentifier = `${numericIdentifier}|x|X|\\*`;
const xRangePlain = `[v=\\s]*(${xRangeIdentifier})(?:\\.(${xRangeIdentifier})(?:\\.(${xRangeIdentifier})(?:${preRelease})?${build}?)?)?`;
const hyphenRange = `^\\s*(${xRangePlain})\\s+-\\s+(${xRangePlain})\\s*$`;
const mainVersionLoose = `(${numericIdentifierLoose})\\.(${numericIdentifierLoose})\\.(${numericIdentifierLoose})`;
const loosePlain = `[v=\\s]*${mainVersionLoose}${preReleaseLoose}?${build}?`;
const gtlt = "((?:<|>)?=?)";
const comparatorTrim = `(\\s*)${gtlt}\\s*(${loosePlain}|${xRangePlain})`;
const loneTilde = "(?:~>?)";
const tildeTrim = `(\\s*)${loneTilde}\\s+`;
const loneCaret = "(?:\\^)";
const caretTrim = `(\\s*)${loneCaret}\\s+`;
const star = "(<|>)?=?\\s*\\*";
const caret = `^${loneCaret}${xRangePlain}$`;
const mainVersion = `(${numericIdentifier})\\.(${numericIdentifier})\\.(${numericIdentifier})`;
const fullPlain = `v?${mainVersion}${preRelease}?${build}?`;
const tilde = `^${loneTilde}${xRangePlain}$`;
const xRange = `^${gtlt}\\s*${xRangePlain}$`;
const comparator = `^${gtlt}\\s*(${fullPlain})$|^$`;
const gte0 = "^\\s*>=\\s*0.0.0\\s*$";
function parseRegex(source) {
  return new RegExp(source);
}
function isXVersion(version) {
  return !version || version.toLowerCase() === "x" || version === "*";
}
function pipe(...fns) {
  return (x) => fns.reduce((v, f) => f(v), x);
}
function extractComparator(comparatorString) {
  return comparatorString.match(parseRegex(comparator));
}
function combineVersion(major, minor, patch, preRelease2) {
  const mainVersion2 = `${major}.${minor}.${patch}`;
  if (preRelease2) {
    return `${mainVersion2}-${preRelease2}`;
  }
  return mainVersion2;
}
function parseHyphen(range) {
  return range.replace(parseRegex(hyphenRange), (_range, from, fromMajor, fromMinor, fromPatch, _fromPreRelease, _fromBuild, to, toMajor, toMinor, toPatch, toPreRelease) => {
    if (isXVersion(fromMajor)) {
      from = "";
    } else if (isXVersion(fromMinor)) {
      from = `>=${fromMajor}.0.0`;
    } else if (isXVersion(fromPatch)) {
      from = `>=${fromMajor}.${fromMinor}.0`;
    } else {
      from = `>=${from}`;
    }
    if (isXVersion(toMajor)) {
      to = "";
    } else if (isXVersion(toMinor)) {
      to = `<${Number(toMajor) + 1}.0.0-0`;
    } else if (isXVersion(toPatch)) {
      to = `<${toMajor}.${Number(toMinor) + 1}.0-0`;
    } else if (toPreRelease) {
      to = `<=${toMajor}.${toMinor}.${toPatch}-${toPreRelease}`;
    } else {
      to = `<=${to}`;
    }
    return `${from} ${to}`.trim();
  });
}
function parseComparatorTrim(range) {
  return range.replace(parseRegex(comparatorTrim), "$1$2$3");
}
function parseTildeTrim(range) {
  return range.replace(parseRegex(tildeTrim), "$1~");
}
function parseCaretTrim(range) {
  return range.replace(parseRegex(caretTrim), "$1^");
}
function parseCarets(range) {
  return range.trim().split(/\s+/).map((rangeVersion) => rangeVersion.replace(parseRegex(caret), (_, major, minor, patch, preRelease2) => {
    if (isXVersion(major)) {
      return "";
    } else if (isXVersion(minor)) {
      return `>=${major}.0.0 <${Number(major) + 1}.0.0-0`;
    } else if (isXVersion(patch)) {
      if (major === "0") {
        return `>=${major}.${minor}.0 <${major}.${Number(minor) + 1}.0-0`;
      } else {
        return `>=${major}.${minor}.0 <${Number(major) + 1}.0.0-0`;
      }
    } else if (preRelease2) {
      if (major === "0") {
        if (minor === "0") {
          return `>=${major}.${minor}.${patch}-${preRelease2} <${major}.${minor}.${Number(patch) + 1}-0`;
        } else {
          return `>=${major}.${minor}.${patch}-${preRelease2} <${major}.${Number(minor) + 1}.0-0`;
        }
      } else {
        return `>=${major}.${minor}.${patch}-${preRelease2} <${Number(major) + 1}.0.0-0`;
      }
    } else {
      if (major === "0") {
        if (minor === "0") {
          return `>=${major}.${minor}.${patch} <${major}.${minor}.${Number(patch) + 1}-0`;
        } else {
          return `>=${major}.${minor}.${patch} <${major}.${Number(minor) + 1}.0-0`;
        }
      }
      return `>=${major}.${minor}.${patch} <${Number(major) + 1}.0.0-0`;
    }
  })).join(" ");
}
function parseTildes(range) {
  return range.trim().split(/\s+/).map((rangeVersion) => rangeVersion.replace(parseRegex(tilde), (_, major, minor, patch, preRelease2) => {
    if (isXVersion(major)) {
      return "";
    } else if (isXVersion(minor)) {
      return `>=${major}.0.0 <${Number(major) + 1}.0.0-0`;
    } else if (isXVersion(patch)) {
      return `>=${major}.${minor}.0 <${major}.${Number(minor) + 1}.0-0`;
    } else if (preRelease2) {
      return `>=${major}.${minor}.${patch}-${preRelease2} <${major}.${Number(minor) + 1}.0-0`;
    }
    return `>=${major}.${minor}.${patch} <${major}.${Number(minor) + 1}.0-0`;
  })).join(" ");
}
function parseXRanges(range) {
  return range.split(/\s+/).map((rangeVersion) => rangeVersion.trim().replace(parseRegex(xRange), (ret, gtlt2, major, minor, patch, preRelease2) => {
    const isXMajor = isXVersion(major);
    const isXMinor = isXMajor || isXVersion(minor);
    const isXPatch = isXMinor || isXVersion(patch);
    if (gtlt2 === "=" && isXPatch) {
      gtlt2 = "";
    }
    preRelease2 = "";
    if (isXMajor) {
      if (gtlt2 === ">" || gtlt2 === "<") {
        return "<0.0.0-0";
      } else {
        return "*";
      }
    } else if (gtlt2 && isXPatch) {
      if (isXMinor) {
        minor = 0;
      }
      patch = 0;
      if (gtlt2 === ">") {
        gtlt2 = ">=";
        if (isXMinor) {
          major = Number(major) + 1;
          minor = 0;
          patch = 0;
        } else {
          minor = Number(minor) + 1;
          patch = 0;
        }
      } else if (gtlt2 === "<=") {
        gtlt2 = "<";
        if (isXMinor) {
          major = Number(major) + 1;
        } else {
          minor = Number(minor) + 1;
        }
      }
      if (gtlt2 === "<") {
        preRelease2 = "-0";
      }
      return `${gtlt2 + major}.${minor}.${patch}${preRelease2}`;
    } else if (isXMinor) {
      return `>=${major}.0.0${preRelease2} <${Number(major) + 1}.0.0-0`;
    } else if (isXPatch) {
      return `>=${major}.${minor}.0${preRelease2} <${major}.${Number(minor) + 1}.0-0`;
    }
    return ret;
  })).join(" ");
}
function parseStar(range) {
  return range.trim().replace(parseRegex(star), "");
}
function parseGTE0(comparatorString) {
  return comparatorString.trim().replace(parseRegex(gte0), "");
}
function compareAtom(rangeAtom, versionAtom) {
  rangeAtom = Number(rangeAtom) || rangeAtom;
  versionAtom = Number(versionAtom) || versionAtom;
  if (rangeAtom > versionAtom) {
    return 1;
  }
  if (rangeAtom === versionAtom) {
    return 0;
  }
  return -1;
}
function comparePreRelease(rangeAtom, versionAtom) {
  const { preRelease: rangePreRelease } = rangeAtom;
  const { preRelease: versionPreRelease } = versionAtom;
  if (rangePreRelease === void 0 && Boolean(versionPreRelease)) {
    return 1;
  }
  if (Boolean(rangePreRelease) && versionPreRelease === void 0) {
    return -1;
  }
  if (rangePreRelease === void 0 && versionPreRelease === void 0) {
    return 0;
  }
  for (let i = 0, n = rangePreRelease.length; i <= n; i++) {
    const rangeElement = rangePreRelease[i];
    const versionElement = versionPreRelease[i];
    if (rangeElement === versionElement) {
      continue;
    }
    if (rangeElement === void 0 && versionElement === void 0) {
      return 0;
    }
    if (!rangeElement) {
      return 1;
    }
    if (!versionElement) {
      return -1;
    }
    return compareAtom(rangeElement, versionElement);
  }
  return 0;
}
function compareVersion(rangeAtom, versionAtom) {
  return compareAtom(rangeAtom.major, versionAtom.major) || compareAtom(rangeAtom.minor, versionAtom.minor) || compareAtom(rangeAtom.patch, versionAtom.patch) || comparePreRelease(rangeAtom, versionAtom);
}
function eq(rangeAtom, versionAtom) {
  return rangeAtom.version === versionAtom.version;
}
function compare(rangeAtom, versionAtom) {
  switch (rangeAtom.operator) {
    case "":
    case "=":
      return eq(rangeAtom, versionAtom);
    case ">":
      return compareVersion(rangeAtom, versionAtom) < 0;
    case ">=":
      return eq(rangeAtom, versionAtom) || compareVersion(rangeAtom, versionAtom) < 0;
    case "<":
      return compareVersion(rangeAtom, versionAtom) > 0;
    case "<=":
      return eq(rangeAtom, versionAtom) || compareVersion(rangeAtom, versionAtom) > 0;
    case void 0: {
      return true;
    }
    default:
      return false;
  }
}
function parseComparatorString(range) {
  return pipe(
    // handle caret
    // ^ --> * (any, kinda silly)
    // ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
    // ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
    // ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
    // ^1.2.3 --> >=1.2.3 <2.0.0-0
    // ^1.2.0 --> >=1.2.0 <2.0.0-0
    parseCarets,
    // handle tilde
    // ~, ~> --> * (any, kinda silly)
    // ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
    // ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
    // ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
    // ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
    // ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
    parseTildes,
    parseXRanges,
    parseStar
  )(range);
}
function parseRange(range) {
  return pipe(
    // handle hyphenRange
    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
    parseHyphen,
    // handle trim comparator
    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
    parseComparatorTrim,
    // handle trim tilde
    // `~ 1.2.3` => `~1.2.3`
    parseTildeTrim,
    // handle trim caret
    // `^ 1.2.3` => `^1.2.3`
    parseCaretTrim
  )(range.trim()).split(/\s+/).join(" ");
}
function satisfy(version, range) {
  if (!version) {
    return false;
  }
  const extractedVersion = extractComparator(version);
  if (!extractedVersion) {
    return false;
  }
  const [, versionOperator, , versionMajor, versionMinor, versionPatch, versionPreRelease] = extractedVersion;
  const versionAtom = {
    operator: versionOperator,
    version: combineVersion(versionMajor, versionMinor, versionPatch, versionPreRelease),
    // exclude build atom
    major: versionMajor,
    minor: versionMinor,
    patch: versionPatch,
    preRelease: versionPreRelease?.split(".")
  };
  const orRanges = range.split("||");
  for (const orRange of orRanges) {
    const trimmedOrRange = orRange.trim();
    if (!trimmedOrRange) {
      return true;
    }
    if (trimmedOrRange === "*" || trimmedOrRange === "x") {
      return true;
    }
    try {
      const parsedSubRange = parseRange(trimmedOrRange);
      if (!parsedSubRange.trim()) {
        return true;
      }
      const parsedComparatorString = parsedSubRange.split(" ").map((rangeVersion) => parseComparatorString(rangeVersion)).join(" ");
      if (!parsedComparatorString.trim()) {
        return true;
      }
      const comparators = parsedComparatorString.split(/\s+/).map((comparator2) => parseGTE0(comparator2)).filter(Boolean);
      if (comparators.length === 0) {
        continue;
      }
      let subRangeSatisfied = true;
      for (const comparator2 of comparators) {
        const extractedComparator = extractComparator(comparator2);
        if (!extractedComparator) {
          subRangeSatisfied = false;
          break;
        }
        const [, rangeOperator, , rangeMajor, rangeMinor, rangePatch, rangePreRelease] = extractedComparator;
        const rangeAtom = {
          operator: rangeOperator,
          version: combineVersion(rangeMajor, rangeMinor, rangePatch, rangePreRelease),
          major: rangeMajor,
          minor: rangeMinor,
          patch: rangePatch,
          preRelease: rangePreRelease?.split(".")
        };
        if (!compare(rangeAtom, versionAtom)) {
          subRangeSatisfied = false;
          break;
        }
      }
      if (subRangeSatisfied) {
        return true;
      }
    } catch (e) {
      console.error(`[semver] Error processing range part "${trimmedOrRange}":`, e);
      continue;
    }
  }
  return false;
}
function formatShare(shareArgs, from, name, shareStrategy) {
  let get;
  if ("get" in shareArgs) {
    get = shareArgs.get;
  } else if ("lib" in shareArgs) {
    get = () => Promise.resolve(shareArgs.lib);
  } else {
    get = () => Promise.resolve(() => {
      throw new Error(`Can not get shared '${name}'!`);
    });
  }
  if (shareArgs.shareConfig?.eager && shareArgs.treeShaking?.mode) {
    throw new Error('Can not set "eager:true" and "treeShaking" at the same time!');
  }
  return {
    deps: [],
    useIn: [],
    from,
    loading: null,
    ...shareArgs,
    shareConfig: {
      requiredVersion: `^${shareArgs.version}`,
      singleton: false,
      eager: false,
      strictVersion: false,
      ...shareArgs.shareConfig
    },
    get,
    loaded: shareArgs?.loaded || "lib" in shareArgs ? true : void 0,
    version: shareArgs.version ?? "0",
    scope: Array.isArray(shareArgs.scope) ? shareArgs.scope : [shareArgs.scope ?? "default"],
    strategy: (shareArgs.strategy ?? shareStrategy) || "version-first",
    treeShaking: shareArgs.treeShaking ? {
      ...shareArgs.treeShaking,
      mode: shareArgs.treeShaking.mode ?? "server-calc",
      status: shareArgs.treeShaking.status ?? 1,
      useIn: []
    } : void 0
  };
}
function formatShareConfigs(prevOptions, newOptions) {
  const shareArgs = newOptions.shared || {};
  const from = newOptions.name;
  const newShareInfos = Object.keys(shareArgs).reduce((res, pkgName) => {
    const arrayShareArgs = arrayOptions(shareArgs[pkgName]);
    res[pkgName] = res[pkgName] || [];
    arrayShareArgs.forEach((shareConfig) => {
      res[pkgName].push(formatShare(shareConfig, from, pkgName, newOptions.shareStrategy));
    });
    return res;
  }, {});
  const allShareInfos = {
    ...prevOptions.shared
  };
  Object.keys(newShareInfos).forEach((shareKey) => {
    if (!allShareInfos[shareKey]) {
      allShareInfos[shareKey] = newShareInfos[shareKey];
    } else {
      newShareInfos[shareKey].forEach((newUserSharedOptions) => {
        const isSameVersion = allShareInfos[shareKey].find((sharedVal) => sharedVal.version === newUserSharedOptions.version);
        if (!isSameVersion) {
          allShareInfos[shareKey].push(newUserSharedOptions);
        }
      });
    }
  });
  return { allShareInfos, newShareInfos };
}
function shouldUseTreeShaking(treeShaking, usedExports) {
  if (!treeShaking) {
    return false;
  }
  const { status, mode } = treeShaking;
  if (status === 0) {
    return false;
  }
  if (status === 2) {
    return true;
  }
  if (mode === "runtime-infer") {
    if (!usedExports) {
      return true;
    }
    return isMatchUsedExports(treeShaking, usedExports);
  }
  return false;
}
function versionLt(a, b) {
  const transformInvalidVersion = (version) => {
    const isNumberVersion = !Number.isNaN(Number(version));
    if (isNumberVersion) {
      const splitArr = version.split(".");
      let validVersion = version;
      for (let i = 0; i < 3 - splitArr.length; i++) {
        validVersion += ".0";
      }
      return validVersion;
    }
    return version;
  };
  if (satisfy(transformInvalidVersion(a), `<=${transformInvalidVersion(b)}`)) {
    return true;
  } else {
    return false;
  }
}
const findVersion = (shareVersionMap, cb) => {
  const callback = cb || function(prev, cur) {
    return versionLt(prev, cur);
  };
  return Object.keys(shareVersionMap).reduce((prev, cur) => {
    if (!prev) {
      return cur;
    }
    if (callback(prev, cur)) {
      return cur;
    }
    if (prev === "0") {
      return cur;
    }
    return prev;
  }, 0);
};
const isLoaded = (shared) => {
  return Boolean(shared.loaded) || typeof shared.lib === "function";
};
const isLoading = (shared) => {
  return Boolean(shared.loading);
};
const isMatchUsedExports = (treeShaking, usedExports) => {
  if (!treeShaking || !usedExports) {
    return false;
  }
  const { usedExports: treeShakingUsedExports } = treeShaking;
  if (!treeShakingUsedExports) {
    return false;
  }
  if (usedExports.every((e) => treeShakingUsedExports.includes(e))) {
    return true;
  }
  return false;
};
function findSingletonVersionOrderByVersion(shareScopeMap, scope, pkgName, treeShaking) {
  const versions = shareScopeMap[scope][pkgName];
  let version = "";
  let useTreesShaking = shouldUseTreeShaking(treeShaking);
  const callback = function(prev, cur) {
    if (useTreesShaking) {
      if (!versions[prev].treeShaking) {
        return true;
      }
      if (!versions[cur].treeShaking) {
        return false;
      }
      return !isLoaded(versions[prev].treeShaking) && versionLt(prev, cur);
    }
    return !isLoaded(versions[prev]) && versionLt(prev, cur);
  };
  if (useTreesShaking) {
    version = findVersion(shareScopeMap[scope][pkgName], callback);
    if (version) {
      return {
        version,
        useTreesShaking
      };
    }
    useTreesShaking = false;
  }
  return {
    version: findVersion(shareScopeMap[scope][pkgName], callback),
    useTreesShaking
  };
}
const isLoadingOrLoaded = (shared) => {
  return isLoaded(shared) || isLoading(shared);
};
function findSingletonVersionOrderByLoaded(shareScopeMap, scope, pkgName, treeShaking) {
  const versions = shareScopeMap[scope][pkgName];
  let version = "";
  let useTreesShaking = shouldUseTreeShaking(treeShaking);
  const callback = function(prev, cur) {
    if (useTreesShaking) {
      if (!versions[prev].treeShaking) {
        return true;
      }
      if (!versions[cur].treeShaking) {
        return false;
      }
      if (isLoadingOrLoaded(versions[cur].treeShaking)) {
        if (isLoadingOrLoaded(versions[prev].treeShaking)) {
          return Boolean(versionLt(prev, cur));
        } else {
          return true;
        }
      }
      if (isLoadingOrLoaded(versions[prev].treeShaking)) {
        return false;
      }
    }
    if (isLoadingOrLoaded(versions[cur])) {
      if (isLoadingOrLoaded(versions[prev])) {
        return Boolean(versionLt(prev, cur));
      } else {
        return true;
      }
    }
    if (isLoadingOrLoaded(versions[prev])) {
      return false;
    }
    return versionLt(prev, cur);
  };
  if (useTreesShaking) {
    version = findVersion(shareScopeMap[scope][pkgName], callback);
    if (version) {
      return {
        version,
        useTreesShaking
      };
    }
    useTreesShaking = false;
  }
  return {
    version: findVersion(shareScopeMap[scope][pkgName], callback),
    useTreesShaking
  };
}
function getFindShareFunction(strategy) {
  if (strategy === "loaded-first") {
    return findSingletonVersionOrderByLoaded;
  }
  return findSingletonVersionOrderByVersion;
}
function getRegisteredShare(localShareScopeMap, pkgName, shareInfo, resolveShare) {
  if (!localShareScopeMap) {
    return;
  }
  const { shareConfig, scope = DEFAULT_SCOPE, strategy, treeShaking } = shareInfo;
  const scopes = Array.isArray(scope) ? scope : [scope];
  for (const sc of scopes) {
    if (shareConfig && localShareScopeMap[sc] && localShareScopeMap[sc][pkgName]) {
      const { requiredVersion } = shareConfig;
      const findShareFunction = getFindShareFunction(strategy);
      const { version: maxOrSingletonVersion, useTreesShaking } = findShareFunction(localShareScopeMap, sc, pkgName, treeShaking);
      const defaultResolver = () => {
        const shared = localShareScopeMap[sc][pkgName][maxOrSingletonVersion];
        if (shareConfig.singleton) {
          if (typeof requiredVersion === "string" && !satisfy(maxOrSingletonVersion, requiredVersion)) {
            const msg = `Version ${maxOrSingletonVersion} from ${maxOrSingletonVersion && shared.from} of shared singleton module ${pkgName} does not satisfy the requirement of ${shareInfo.from} which needs ${requiredVersion})`;
            if (shareConfig.strictVersion) {
              error(msg);
            } else {
              warn(msg);
            }
          }
          return {
            shared,
            useTreesShaking
          };
        } else {
          if (requiredVersion === false || requiredVersion === "*") {
            return {
              shared,
              useTreesShaking
            };
          }
          if (satisfy(maxOrSingletonVersion, requiredVersion)) {
            return {
              shared,
              useTreesShaking
            };
          }
          const _usedTreeShaking = shouldUseTreeShaking(treeShaking);
          if (_usedTreeShaking) {
            for (const [versionKey, versionValue] of Object.entries(localShareScopeMap[sc][pkgName])) {
              if (!shouldUseTreeShaking(versionValue.treeShaking, treeShaking?.usedExports)) {
                continue;
              }
              if (satisfy(versionKey, requiredVersion)) {
                return {
                  shared: versionValue,
                  useTreesShaking: _usedTreeShaking
                };
              }
            }
          }
          for (const [versionKey, versionValue] of Object.entries(localShareScopeMap[sc][pkgName])) {
            if (satisfy(versionKey, requiredVersion)) {
              return {
                shared: versionValue,
                useTreesShaking: false
              };
            }
          }
        }
        return;
      };
      const params = {
        shareScopeMap: localShareScopeMap,
        scope: sc,
        pkgName,
        version: maxOrSingletonVersion,
        GlobalFederation: Global.__FEDERATION__,
        shareInfo,
        resolver: defaultResolver
      };
      const resolveShared = resolveShare.emit(params) || params;
      return resolveShared.resolver();
    }
  }
}
function getGlobalShareScope() {
  return Global.__FEDERATION__.__SHARE__;
}
function getTargetSharedOptions(options) {
  const { pkgName, extraOptions, shareInfos } = options;
  const defaultResolver = (sharedOptions) => {
    if (!sharedOptions) {
      return void 0;
    }
    const shareVersionMap = {};
    sharedOptions.forEach((shared) => {
      shareVersionMap[shared.version] = shared;
    });
    const callback = function(prev, cur) {
      return (
        // TODO: consider multiple treeShaking shared scenes
        !isLoaded(shareVersionMap[prev]) && versionLt(prev, cur)
      );
    };
    const maxVersion = findVersion(shareVersionMap, callback);
    return shareVersionMap[maxVersion];
  };
  const resolver = extraOptions?.resolver ?? defaultResolver;
  const isPlainObject2 = (val) => {
    return val !== null && typeof val === "object" && !Array.isArray(val);
  };
  const merge = (...sources) => {
    const out = {};
    for (const src of sources) {
      if (!src)
        continue;
      for (const [key, value] of Object.entries(src)) {
        const prev = out[key];
        if (isPlainObject2(prev) && isPlainObject2(value)) {
          out[key] = merge(prev, value);
        } else if (value !== void 0) {
          out[key] = value;
        }
      }
    }
    return out;
  };
  return merge(resolver(shareInfos[pkgName]), extraOptions?.customShareInfo);
}
const addUseIn = (shared, from) => {
  if (!shared.useIn) {
    shared.useIn = [];
  }
  addUniqueItem(shared.useIn, from);
};
function directShare(shared, useTreesShaking) {
  if (useTreesShaking && shared.treeShaking) {
    return shared.treeShaking;
  }
  return shared;
}
function getBuilderId$1() {
  return typeof FEDERATION_BUILD_IDENTIFIER !== "undefined" ? (
    //@ts-ignore
    FEDERATION_BUILD_IDENTIFIER
  ) : "";
}
function matchRemoteWithNameAndExpose(remotes, id) {
  for (const remote of remotes) {
    const isNameMatched = id.startsWith(remote.name);
    let expose = id.replace(remote.name, "");
    if (isNameMatched) {
      if (expose.startsWith("/")) {
        const pkgNameOrAlias = remote.name;
        expose = `.${expose}`;
        return {
          pkgNameOrAlias,
          expose,
          remote
        };
      } else if (expose === "") {
        return {
          pkgNameOrAlias: remote.name,
          expose: ".",
          remote
        };
      }
    }
    const isAliasMatched = remote.alias && id.startsWith(remote.alias);
    let exposeWithAlias = remote.alias && id.replace(remote.alias, "");
    if (remote.alias && isAliasMatched) {
      if (exposeWithAlias && exposeWithAlias.startsWith("/")) {
        const pkgNameOrAlias = remote.alias;
        exposeWithAlias = `.${exposeWithAlias}`;
        return {
          pkgNameOrAlias,
          expose: exposeWithAlias,
          remote
        };
      } else if (exposeWithAlias === "") {
        return {
          pkgNameOrAlias: remote.alias,
          expose: ".",
          remote
        };
      }
    }
  }
  return;
}
function matchRemote(remotes, nameOrAlias) {
  for (const remote of remotes) {
    const isNameMatched = nameOrAlias === remote.name;
    if (isNameMatched) {
      return remote;
    }
    const isAliasMatched = remote.alias && nameOrAlias === remote.alias;
    if (isAliasMatched) {
      return remote;
    }
  }
  return;
}
function registerPlugins(plugins, instance) {
  const globalPlugins = getGlobalHostPlugins();
  const hookInstances = [
    instance.hooks,
    instance.remoteHandler.hooks,
    instance.sharedHandler.hooks,
    instance.snapshotHandler.hooks,
    instance.loaderHook,
    instance.bridgeHook
  ];
  if (globalPlugins.length > 0) {
    globalPlugins.forEach((plugin) => {
      if (plugins?.find((item) => item.name !== plugin.name)) {
        plugins.push(plugin);
      }
    });
  }
  if (plugins && plugins.length > 0) {
    plugins.forEach((plugin) => {
      hookInstances.forEach((hookInstance) => {
        hookInstance.applyPlugin(plugin, instance);
      });
    });
  }
  return plugins;
}
const importCallback = ".then(callbacks[0]).catch(callbacks[1])";
async function loadEsmEntry({ entry, remoteEntryExports }) {
  return new Promise((resolve, reject) => {
    try {
      if (!remoteEntryExports) {
        if (typeof FEDERATION_ALLOW_NEW_FUNCTION !== "undefined") {
          new Function("callbacks", `import("${entry}")${importCallback}`)([
            resolve,
            reject
          ]);
        } else {
          import(
            /* webpackIgnore: true */
            /* @vite-ignore */
            entry
          ).then(resolve).catch(reject);
        }
      } else {
        resolve(remoteEntryExports);
      }
    } catch (e) {
      reject(e);
    }
  });
}
async function loadSystemJsEntry({ entry, remoteEntryExports }) {
  return new Promise((resolve, reject) => {
    try {
      if (!remoteEntryExports) {
        if (typeof __system_context__ === "undefined") {
          System.import(entry).then(resolve).catch(reject);
        } else {
          new Function("callbacks", `System.import("${entry}")${importCallback}`)([resolve, reject]);
        }
      } else {
        resolve(remoteEntryExports);
      }
    } catch (e) {
      reject(e);
    }
  });
}
function handleRemoteEntryLoaded(name, globalName, entry) {
  const { remoteEntryKey, entryExports } = getRemoteEntryExports(name, globalName);
  assert(entryExports, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_001, errorCodes.runtimeDescMap, {
    remoteName: name,
    remoteEntryUrl: entry,
    remoteEntryKey
  }));
  return entryExports;
}
async function loadEntryScript({ name, globalName, entry, loaderHook, getEntryUrl }) {
  const { entryExports: remoteEntryExports } = getRemoteEntryExports(name, globalName);
  if (remoteEntryExports) {
    return remoteEntryExports;
  }
  const url = getEntryUrl ? getEntryUrl(entry) : entry;
  return sdk.loadScript(url, {
    attrs: {},
    createScriptHook: (url2, attrs) => {
      const res = loaderHook.lifecycle.createScript.emit({ url: url2, attrs });
      if (!res)
        return;
      if (res instanceof HTMLScriptElement) {
        return res;
      }
      if ("script" in res || "timeout" in res) {
        return res;
      }
      return;
    }
  }).then(() => {
    return handleRemoteEntryLoaded(name, globalName, entry);
  }).catch((e) => {
    assert(void 0, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_008, errorCodes.runtimeDescMap, {
      remoteName: name,
      resourceUrl: entry
    }));
    throw e;
  });
}
async function loadEntryDom({ remoteInfo, remoteEntryExports, loaderHook, getEntryUrl }) {
  const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
  switch (type) {
    case "esm":
    case "module":
      return loadEsmEntry({ entry, remoteEntryExports });
    case "system":
      return loadSystemJsEntry({ entry, remoteEntryExports });
    default:
      return loadEntryScript({
        entry,
        globalName,
        name,
        loaderHook,
        getEntryUrl
      });
  }
}
async function loadEntryNode({ remoteInfo, loaderHook }) {
  const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
  const { entryExports: remoteEntryExports } = getRemoteEntryExports(name, globalName);
  if (remoteEntryExports) {
    return remoteEntryExports;
  }
  return sdk.loadScriptNode(entry, {
    attrs: { name, globalName, type },
    loaderHook: {
      createScriptHook: (url, attrs = {}) => {
        const res = loaderHook.lifecycle.createScript.emit({ url, attrs });
        if (!res)
          return;
        if ("url" in res) {
          return res;
        }
        return;
      }
    }
  }).then(() => {
    return handleRemoteEntryLoaded(name, globalName, entry);
  }).catch((e) => {
    throw e;
  });
}
function getRemoteEntryUniqueKey(remoteInfo) {
  const { entry, name } = remoteInfo;
  return sdk.composeKeyWithSeparator(name, entry);
}
async function getRemoteEntry(params) {
  const { origin, remoteEntryExports, remoteInfo, getEntryUrl, _inErrorHandling = false } = params;
  const uniqueKey = getRemoteEntryUniqueKey(remoteInfo);
  if (remoteEntryExports) {
    return remoteEntryExports;
  }
  if (!globalLoading[uniqueKey]) {
    const loadEntryHook = origin.remoteHandler.hooks.lifecycle.loadEntry;
    const loaderHook = origin.loaderHook;
    globalLoading[uniqueKey] = loadEntryHook.emit({
      loaderHook,
      remoteInfo,
      remoteEntryExports
    }).then((res) => {
      if (res) {
        return res;
      }
      const isWebEnvironment = true ;
      return isWebEnvironment ? loadEntryDom({
        remoteInfo,
        remoteEntryExports,
        loaderHook,
        getEntryUrl
      }) : loadEntryNode({ remoteInfo, loaderHook });
    }).catch(async (err) => {
      const uniqueKey2 = getRemoteEntryUniqueKey(remoteInfo);
      const isScriptLoadError = err instanceof Error && err.message.includes(errorCodes.RUNTIME_008);
      if (isScriptLoadError && !_inErrorHandling) {
        const wrappedGetRemoteEntry = (params2) => {
          return getRemoteEntry({ ...params2, _inErrorHandling: true });
        };
        const RemoteEntryExports = await origin.loaderHook.lifecycle.loadEntryError.emit({
          getRemoteEntry: wrappedGetRemoteEntry,
          origin,
          remoteInfo,
          remoteEntryExports,
          globalLoading,
          uniqueKey: uniqueKey2
        });
        if (RemoteEntryExports) {
          return RemoteEntryExports;
        }
      }
      throw err;
    });
  }
  return globalLoading[uniqueKey];
}
function getRemoteInfo(remote) {
  return {
    ...remote,
    entry: "entry" in remote ? remote.entry : "",
    type: remote.type || DEFAULT_REMOTE_TYPE,
    entryGlobalName: remote.entryGlobalName || remote.name,
    shareScope: remote.shareScope || DEFAULT_SCOPE
  };
}
function defaultPreloadArgs(preloadConfig) {
  return {
    resourceCategory: "sync",
    share: true,
    depsRemote: true,
    prefetchInterface: false,
    ...preloadConfig
  };
}
function formatPreloadArgs(remotes, preloadArgs) {
  return preloadArgs.map((args) => {
    const remoteInfo = matchRemote(remotes, args.nameOrAlias);
    assert(remoteInfo, `Unable to preload ${args.nameOrAlias} as it is not included in ${!remoteInfo && sdk.safeToString({
      remoteInfo,
      remotes
    })}`);
    return {
      remote: remoteInfo,
      preloadConfig: defaultPreloadArgs(args)
    };
  });
}
function normalizePreloadExposes(exposes) {
  if (!exposes) {
    return [];
  }
  return exposes.map((expose) => {
    if (expose === ".") {
      return expose;
    }
    if (expose.startsWith("./")) {
      return expose.replace("./", "");
    }
    return expose;
  });
}
function preloadAssets(remoteInfo, host, assets, useLinkPreload = true) {
  const { cssAssets, jsAssetsWithoutEntry, entryAssets } = assets;
  if (host.options.inBrowser) {
    entryAssets.forEach((asset) => {
      const { moduleInfo } = asset;
      const module = host.moduleCache.get(remoteInfo.name);
      if (module) {
        getRemoteEntry({
          origin: host,
          remoteInfo: moduleInfo,
          remoteEntryExports: module.remoteEntryExports
        });
      } else {
        getRemoteEntry({
          origin: host,
          remoteInfo: moduleInfo,
          remoteEntryExports: void 0
        });
      }
    });
    if (useLinkPreload) {
      const defaultAttrs = {
        rel: "preload",
        as: "style"
      };
      cssAssets.forEach((cssUrl) => {
        const { link: cssEl, needAttach } = sdk.createLink({
          url: cssUrl,
          cb: () => {
          },
          attrs: defaultAttrs,
          createLinkHook: (url, attrs) => {
            const res = host.loaderHook.lifecycle.createLink.emit({
              url,
              attrs
            });
            if (res instanceof HTMLLinkElement) {
              return res;
            }
            return;
          }
        });
        needAttach && document.head.appendChild(cssEl);
      });
    } else {
      const defaultAttrs = {
        rel: "stylesheet",
        type: "text/css"
      };
      cssAssets.forEach((cssUrl) => {
        const { link: cssEl, needAttach } = sdk.createLink({
          url: cssUrl,
          cb: () => {
          },
          attrs: defaultAttrs,
          createLinkHook: (url, attrs) => {
            const res = host.loaderHook.lifecycle.createLink.emit({
              url,
              attrs
            });
            if (res instanceof HTMLLinkElement) {
              return res;
            }
            return;
          },
          needDeleteLink: false
        });
        needAttach && document.head.appendChild(cssEl);
      });
    }
    if (useLinkPreload) {
      const defaultAttrs = {
        rel: "preload",
        as: "script"
      };
      jsAssetsWithoutEntry.forEach((jsUrl) => {
        const { link: linkEl, needAttach } = sdk.createLink({
          url: jsUrl,
          cb: () => {
          },
          attrs: defaultAttrs,
          createLinkHook: (url, attrs) => {
            const res = host.loaderHook.lifecycle.createLink.emit({
              url,
              attrs
            });
            if (res instanceof HTMLLinkElement) {
              return res;
            }
            return;
          }
        });
        needAttach && document.head.appendChild(linkEl);
      });
    } else {
      const defaultAttrs = {
        fetchpriority: "high",
        type: remoteInfo?.type === "module" ? "module" : "text/javascript"
      };
      jsAssetsWithoutEntry.forEach((jsUrl) => {
        const { script: scriptEl, needAttach } = sdk.createScript({
          url: jsUrl,
          cb: () => {
          },
          attrs: defaultAttrs,
          createScriptHook: (url, attrs) => {
            const res = host.loaderHook.lifecycle.createScript.emit({
              url,
              attrs
            });
            if (res instanceof HTMLScriptElement) {
              return res;
            }
            return;
          },
          needDeleteScript: true
        });
        needAttach && document.head.appendChild(scriptEl);
      });
    }
  }
}
const ShareUtils = {
  getRegisteredShare,
  getGlobalShareScope
};
const GlobalUtils = {
  Global,
  nativeGlobal,
  resetFederationGlobalInfo,
  setGlobalFederationInstance,
  getGlobalFederationConstructor,
  setGlobalFederationConstructor,
  getInfoWithoutType,
  getGlobalSnapshot,
  getTargetSnapshotInfoByModuleInfo,
  getGlobalSnapshotInfoByModuleInfo,
  setGlobalSnapshotInfoByModuleInfo,
  addGlobalSnapshot,
  getRemoteEntryExports,
  registerGlobalPlugins,
  getGlobalHostPlugins,
  getPreloaded,
  setPreloaded
};
var helpers = {
  global: GlobalUtils,
  share: ShareUtils,
  utils: {
    matchRemoteWithNameAndExpose,
    preloadAssets,
    getRemoteInfo
  }
};
function createRemoteEntryInitOptions(remoteInfo, hostShareScopeMap) {
  const localShareScopeMap = hostShareScopeMap;
  const shareScopeKeys = Array.isArray(remoteInfo.shareScope) ? remoteInfo.shareScope : [remoteInfo.shareScope];
  if (!shareScopeKeys.length) {
    shareScopeKeys.push("default");
  }
  shareScopeKeys.forEach((shareScopeKey) => {
    if (!localShareScopeMap[shareScopeKey]) {
      localShareScopeMap[shareScopeKey] = {};
    }
  });
  const remoteEntryInitOptions = {
    version: remoteInfo.version || "",
    shareScopeKeys: Array.isArray(remoteInfo.shareScope) ? shareScopeKeys : remoteInfo.shareScope || "default"
  };
  Object.defineProperty(remoteEntryInitOptions, "shareScopeMap", {
    value: localShareScopeMap,
    // remoteEntryInitOptions will be traversed and assigned during container init, ,so this attribute is not allowed to be traversed
    enumerable: false
  });
  const shareScope = localShareScopeMap[shareScopeKeys[0]];
  const initScope = [];
  return {
    remoteEntryInitOptions,
    shareScope,
    initScope
  };
}
class Module {
  constructor({ remoteInfo, host }) {
    this.inited = false;
    this.initing = false;
    this.lib = void 0;
    this.remoteInfo = remoteInfo;
    this.host = host;
  }
  async getEntry() {
    if (this.remoteEntryExports) {
      return this.remoteEntryExports;
    }
    const remoteEntryExports = await getRemoteEntry({
      origin: this.host,
      remoteInfo: this.remoteInfo,
      remoteEntryExports: this.remoteEntryExports
    });
    assert(remoteEntryExports, `remoteEntryExports is undefined 
 ${sdk.safeToString(this.remoteInfo)}`);
    this.remoteEntryExports = remoteEntryExports;
    return this.remoteEntryExports;
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async init(id, remoteSnapshot) {
    const remoteEntryExports = await this.getEntry();
    if (this.inited) {
      return remoteEntryExports;
    }
    if (this.initPromise) {
      await this.initPromise;
      return remoteEntryExports;
    }
    this.initing = true;
    this.initPromise = (async () => {
      const { remoteEntryInitOptions, shareScope, initScope } = createRemoteEntryInitOptions(this.remoteInfo, this.host.shareScopeMap);
      const initContainerOptions = await this.host.hooks.lifecycle.beforeInitContainer.emit({
        shareScope,
        // @ts-ignore shareScopeMap will be set by Object.defineProperty
        remoteEntryInitOptions,
        initScope,
        remoteInfo: this.remoteInfo,
        origin: this.host
      });
      if (typeof remoteEntryExports?.init === "undefined") {
        error(errorCodes.getShortErrorMsg(errorCodes.RUNTIME_002, errorCodes.runtimeDescMap, {
          hostName: this.host.name,
          remoteName: this.remoteInfo.name,
          remoteEntryUrl: this.remoteInfo.entry,
          remoteEntryKey: this.remoteInfo.entryGlobalName
        }));
      }
      await remoteEntryExports.init(initContainerOptions.shareScope, initContainerOptions.initScope, initContainerOptions.remoteEntryInitOptions);
      await this.host.hooks.lifecycle.initContainer.emit({
        ...initContainerOptions,
        id,
        remoteSnapshot,
        remoteEntryExports
      });
      this.inited = true;
    })();
    try {
      await this.initPromise;
    } finally {
      this.initing = false;
      this.initPromise = void 0;
    }
    return remoteEntryExports;
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async get(id, expose, options, remoteSnapshot) {
    const { loadFactory = true } = options || { loadFactory: true };
    const remoteEntryExports = await this.init(id, remoteSnapshot);
    this.lib = remoteEntryExports;
    let moduleFactory;
    moduleFactory = await this.host.loaderHook.lifecycle.getModuleFactory.emit({
      remoteEntryExports,
      expose,
      moduleInfo: this.remoteInfo
    });
    if (!moduleFactory) {
      moduleFactory = await remoteEntryExports.get(expose);
    }
    assert(moduleFactory, `${getFMId(this.remoteInfo)} remote don't export ${expose}.`);
    const symbolName = processModuleAlias(this.remoteInfo.name, expose);
    const wrapModuleFactory = this.wraperFactory(moduleFactory, symbolName);
    if (!loadFactory) {
      return wrapModuleFactory;
    }
    const exposeContent = await wrapModuleFactory();
    return exposeContent;
  }
  wraperFactory(moduleFactory, id) {
    function defineModuleId(res, id2) {
      if (res && typeof res === "object" && Object.isExtensible(res) && !Object.getOwnPropertyDescriptor(res, Symbol.for("mf_module_id"))) {
        Object.defineProperty(res, Symbol.for("mf_module_id"), {
          value: id2,
          enumerable: false
        });
      }
    }
    if (moduleFactory instanceof Promise) {
      return async () => {
        const res = await moduleFactory();
        defineModuleId(res, id);
        return res;
      };
    } else {
      return () => {
        const res = moduleFactory();
        defineModuleId(res, id);
        return res;
      };
    }
  }
}
class SyncHook {
  constructor(type) {
    this.type = "";
    this.listeners = /* @__PURE__ */ new Set();
    if (type) {
      this.type = type;
    }
  }
  on(fn) {
    if (typeof fn === "function") {
      this.listeners.add(fn);
    }
  }
  once(fn) {
    const self = this;
    this.on(function wrapper(...args) {
      self.remove(wrapper);
      return fn.apply(null, args);
    });
  }
  emit(...data) {
    let result;
    if (this.listeners.size > 0) {
      this.listeners.forEach((fn) => {
        result = fn(...data);
      });
    }
    return result;
  }
  remove(fn) {
    this.listeners.delete(fn);
  }
  removeAll() {
    this.listeners.clear();
  }
}
class AsyncHook extends SyncHook {
  emit(...data) {
    let result;
    const ls = Array.from(this.listeners);
    if (ls.length > 0) {
      let i = 0;
      const call = (prev) => {
        if (prev === false) {
          return false;
        } else if (i < ls.length) {
          return Promise.resolve(ls[i++].apply(null, data)).then(call);
        } else {
          return prev;
        }
      };
      result = call();
    }
    return Promise.resolve(result);
  }
}
function checkReturnData(originalData, returnedData) {
  if (!isObject(returnedData)) {
    return false;
  }
  if (originalData !== returnedData) {
    for (const key in originalData) {
      if (!(key in returnedData)) {
        return false;
      }
    }
  }
  return true;
}
class SyncWaterfallHook extends SyncHook {
  constructor(type) {
    super();
    this.onerror = error;
    this.type = type;
  }
  emit(data) {
    if (!isObject(data)) {
      error(`The data for the "${this.type}" hook should be an object.`);
    }
    for (const fn of this.listeners) {
      try {
        const tempData = fn(data);
        if (checkReturnData(data, tempData)) {
          data = tempData;
        } else {
          this.onerror(`A plugin returned an unacceptable value for the "${this.type}" type.`);
          break;
        }
      } catch (e) {
        warn(e);
        this.onerror(e);
      }
    }
    return data;
  }
}
class AsyncWaterfallHook extends SyncHook {
  constructor(type) {
    super();
    this.onerror = error;
    this.type = type;
  }
  emit(data) {
    if (!isObject(data)) {
      error(`The response data for the "${this.type}" hook must be an object.`);
    }
    const ls = Array.from(this.listeners);
    if (ls.length > 0) {
      let i = 0;
      const processError = (e) => {
        warn(e);
        this.onerror(e);
        return data;
      };
      const call = (prevData) => {
        if (checkReturnData(data, prevData)) {
          data = prevData;
          if (i < ls.length) {
            try {
              return Promise.resolve(ls[i++](data)).then(call, processError);
            } catch (e) {
              return processError(e);
            }
          }
        } else {
          this.onerror(`A plugin returned an incorrect value for the "${this.type}" type.`);
        }
        return data;
      };
      return Promise.resolve(call(data));
    }
    return Promise.resolve(data);
  }
}
class PluginSystem {
  constructor(lifecycle) {
    this.registerPlugins = {};
    this.lifecycle = lifecycle;
    this.lifecycleKeys = Object.keys(lifecycle);
  }
  applyPlugin(plugin, instance) {
    assert(isPlainObject(plugin), "Plugin configuration is invalid.");
    const pluginName = plugin.name;
    assert(pluginName, "A name must be provided by the plugin.");
    if (!this.registerPlugins[pluginName]) {
      this.registerPlugins[pluginName] = plugin;
      plugin.apply?.(instance);
      Object.keys(this.lifecycle).forEach((key) => {
        const pluginLife = plugin[key];
        if (pluginLife) {
          this.lifecycle[key].on(pluginLife);
        }
      });
    }
  }
  removePlugin(pluginName) {
    assert(pluginName, "A name is required.");
    const plugin = this.registerPlugins[pluginName];
    assert(plugin, `The plugin "${pluginName}" is not registered.`);
    Object.keys(plugin).forEach((key) => {
      if (key !== "name") {
        this.lifecycle[key].remove(plugin[key]);
      }
    });
  }
}
function assignRemoteInfo(remoteInfo, remoteSnapshot) {
  const remoteEntryInfo = getRemoteEntryInfoFromSnapshot(remoteSnapshot);
  if (!remoteEntryInfo.url) {
    error(`The attribute remoteEntry of ${remoteInfo.name} must not be undefined.`);
  }
  let entryUrl = sdk.getResourceUrl(remoteSnapshot, remoteEntryInfo.url);
  if (!sdk.isBrowserEnv() && !entryUrl.startsWith("http")) {
    entryUrl = `https:${entryUrl}`;
  }
  remoteInfo.type = remoteEntryInfo.type;
  remoteInfo.entryGlobalName = remoteEntryInfo.globalName;
  remoteInfo.entry = entryUrl;
  remoteInfo.version = remoteSnapshot.version;
  remoteInfo.buildVersion = remoteSnapshot.buildVersion;
}
function snapshotPlugin() {
  return {
    name: "snapshot-plugin",
    async afterResolve(args) {
      const { remote, pkgNameOrAlias, expose, origin, remoteInfo, id } = args;
      if (!isRemoteInfoWithEntry(remote) || !isPureRemoteEntry(remote)) {
        const { remoteSnapshot, globalSnapshot } = await origin.snapshotHandler.loadRemoteSnapshotInfo({
          moduleInfo: remote,
          id
        });
        assignRemoteInfo(remoteInfo, remoteSnapshot);
        const preloadOptions = {
          remote,
          preloadConfig: {
            nameOrAlias: pkgNameOrAlias,
            exposes: [expose],
            resourceCategory: "sync",
            share: false,
            depsRemote: false
          }
        };
        const assets = await origin.remoteHandler.hooks.lifecycle.generatePreloadAssets.emit({
          origin,
          preloadOptions,
          remoteInfo,
          remote,
          remoteSnapshot,
          globalSnapshot
        });
        if (assets) {
          preloadAssets(remoteInfo, origin, assets, false);
        }
        return {
          ...args,
          remoteSnapshot
        };
      }
      return args;
    }
  };
}
function splitId(id) {
  const splitInfo = id.split(":");
  if (splitInfo.length === 1) {
    return {
      name: splitInfo[0],
      version: void 0
    };
  } else if (splitInfo.length === 2) {
    return {
      name: splitInfo[0],
      version: splitInfo[1]
    };
  } else {
    return {
      name: splitInfo[1],
      version: splitInfo[2]
    };
  }
}
function traverseModuleInfo(globalSnapshot, remoteInfo, traverse, isRoot, memo = {}, remoteSnapshot) {
  const id = getFMId(remoteInfo);
  const { value: snapshotValue } = getInfoWithoutType(globalSnapshot, id);
  const effectiveRemoteSnapshot = remoteSnapshot || snapshotValue;
  if (effectiveRemoteSnapshot && !sdk.isManifestProvider(effectiveRemoteSnapshot)) {
    traverse(effectiveRemoteSnapshot, remoteInfo, isRoot);
    if (effectiveRemoteSnapshot.remotesInfo) {
      const remoteKeys = Object.keys(effectiveRemoteSnapshot.remotesInfo);
      for (const key of remoteKeys) {
        if (memo[key]) {
          continue;
        }
        memo[key] = true;
        const subRemoteInfo = splitId(key);
        const remoteValue = effectiveRemoteSnapshot.remotesInfo[key];
        traverseModuleInfo(globalSnapshot, {
          name: subRemoteInfo.name,
          version: remoteValue.matchedVersion
        }, traverse, false, memo, void 0);
      }
    }
  }
}
const isExisted = (type, url) => {
  return document.querySelector(`${type}[${type === "link" ? "href" : "src"}="${url}"]`);
};
function generatePreloadAssets(origin, preloadOptions, remote, globalSnapshot, remoteSnapshot) {
  const cssAssets = [];
  const jsAssets = [];
  const entryAssets = [];
  const loadedSharedJsAssets = /* @__PURE__ */ new Set();
  const loadedSharedCssAssets = /* @__PURE__ */ new Set();
  const { options } = origin;
  const { preloadConfig: rootPreloadConfig } = preloadOptions;
  const { depsRemote } = rootPreloadConfig;
  const memo = {};
  traverseModuleInfo(globalSnapshot, remote, (moduleInfoSnapshot, remoteInfo, isRoot) => {
    let preloadConfig;
    if (isRoot) {
      preloadConfig = rootPreloadConfig;
    } else {
      if (Array.isArray(depsRemote)) {
        const findPreloadConfig = depsRemote.find((remoteConfig) => {
          if (remoteConfig.nameOrAlias === remoteInfo.name || remoteConfig.nameOrAlias === remoteInfo.alias) {
            return true;
          }
          return false;
        });
        if (!findPreloadConfig) {
          return;
        }
        preloadConfig = defaultPreloadArgs(findPreloadConfig);
      } else if (depsRemote === true) {
        preloadConfig = rootPreloadConfig;
      } else {
        return;
      }
    }
    const remoteEntryUrl = sdk.getResourceUrl(moduleInfoSnapshot, getRemoteEntryInfoFromSnapshot(moduleInfoSnapshot).url);
    if (remoteEntryUrl) {
      entryAssets.push({
        name: remoteInfo.name,
        moduleInfo: {
          name: remoteInfo.name,
          entry: remoteEntryUrl,
          type: "remoteEntryType" in moduleInfoSnapshot ? moduleInfoSnapshot.remoteEntryType : "global",
          entryGlobalName: "globalName" in moduleInfoSnapshot ? moduleInfoSnapshot.globalName : remoteInfo.name,
          shareScope: "",
          version: "version" in moduleInfoSnapshot ? moduleInfoSnapshot.version : void 0
        },
        url: remoteEntryUrl
      });
    }
    let moduleAssetsInfo = "modules" in moduleInfoSnapshot ? moduleInfoSnapshot.modules : [];
    const normalizedPreloadExposes = normalizePreloadExposes(preloadConfig.exposes);
    if (normalizedPreloadExposes.length && "modules" in moduleInfoSnapshot) {
      moduleAssetsInfo = moduleInfoSnapshot?.modules?.reduce((assets, moduleAssetInfo) => {
        if (normalizedPreloadExposes?.indexOf(moduleAssetInfo.moduleName) !== -1) {
          assets.push(moduleAssetInfo);
        }
        return assets;
      }, []);
    }
    function handleAssets(assets) {
      const assetsRes = assets.map((asset) => sdk.getResourceUrl(moduleInfoSnapshot, asset));
      if (preloadConfig.filter) {
        return assetsRes.filter(preloadConfig.filter);
      }
      return assetsRes;
    }
    if (moduleAssetsInfo) {
      const assetsLength = moduleAssetsInfo.length;
      for (let index2 = 0; index2 < assetsLength; index2++) {
        const assetsInfo = moduleAssetsInfo[index2];
        const exposeFullPath = `${remoteInfo.name}/${assetsInfo.moduleName}`;
        origin.remoteHandler.hooks.lifecycle.handlePreloadModule.emit({
          id: assetsInfo.moduleName === "." ? remoteInfo.name : exposeFullPath,
          name: remoteInfo.name,
          remoteSnapshot: moduleInfoSnapshot,
          preloadConfig,
          remote: remoteInfo,
          origin
        });
        const preloaded = getPreloaded(exposeFullPath);
        if (preloaded) {
          continue;
        }
        if (preloadConfig.resourceCategory === "all") {
          cssAssets.push(...handleAssets(assetsInfo.assets.css.async));
          cssAssets.push(...handleAssets(assetsInfo.assets.css.sync));
          jsAssets.push(...handleAssets(assetsInfo.assets.js.async));
          jsAssets.push(...handleAssets(assetsInfo.assets.js.sync));
        } else if (preloadConfig.resourceCategory = "sync") {
          cssAssets.push(...handleAssets(assetsInfo.assets.css.sync));
          jsAssets.push(...handleAssets(assetsInfo.assets.js.sync));
        }
        setPreloaded(exposeFullPath);
      }
    }
  }, true, memo, remoteSnapshot);
  if (remoteSnapshot.shared && remoteSnapshot.shared.length > 0) {
    const collectSharedAssets = (shareInfo, snapshotShared) => {
      const { shared: registeredShared } = getRegisteredShare(origin.shareScopeMap, snapshotShared.sharedName, shareInfo, origin.sharedHandler.hooks.lifecycle.resolveShare) || {};
      if (registeredShared && typeof registeredShared.lib === "function") {
        snapshotShared.assets.js.sync.forEach((asset) => {
          loadedSharedJsAssets.add(asset);
        });
        snapshotShared.assets.css.sync.forEach((asset) => {
          loadedSharedCssAssets.add(asset);
        });
      }
    };
    remoteSnapshot.shared.forEach((shared) => {
      const shareInfos = options.shared?.[shared.sharedName];
      if (!shareInfos) {
        return;
      }
      const sharedOptions = shared.version ? shareInfos.find((s) => s.version === shared.version) : shareInfos;
      if (!sharedOptions) {
        return;
      }
      const arrayShareInfo = arrayOptions(sharedOptions);
      arrayShareInfo.forEach((s) => {
        collectSharedAssets(s, shared);
      });
    });
  }
  const needPreloadJsAssets = jsAssets.filter((asset) => !loadedSharedJsAssets.has(asset) && !isExisted("script", asset));
  const needPreloadCssAssets = cssAssets.filter((asset) => !loadedSharedCssAssets.has(asset) && !isExisted("link", asset));
  return {
    cssAssets: needPreloadCssAssets,
    jsAssetsWithoutEntry: needPreloadJsAssets,
    entryAssets: entryAssets.filter((entry) => !isExisted("script", entry.url))
  };
}
const generatePreloadAssetsPlugin = function() {
  return {
    name: "generate-preload-assets-plugin",
    async generatePreloadAssets(args) {
      const { origin, preloadOptions, remoteInfo, remote, globalSnapshot, remoteSnapshot } = args;
      if (!sdk.isBrowserEnv()) {
        return {
          cssAssets: [],
          jsAssetsWithoutEntry: [],
          entryAssets: []
        };
      }
      if (isRemoteInfoWithEntry(remote) && isPureRemoteEntry(remote)) {
        return {
          cssAssets: [],
          jsAssetsWithoutEntry: [],
          entryAssets: [
            {
              name: remote.name,
              url: remote.entry,
              moduleInfo: {
                name: remoteInfo.name,
                entry: remote.entry,
                type: remoteInfo.type || "global",
                entryGlobalName: "",
                shareScope: ""
              }
            }
          ]
        };
      }
      assignRemoteInfo(remoteInfo, remoteSnapshot);
      const assets = generatePreloadAssets(origin, preloadOptions, remoteInfo, globalSnapshot, remoteSnapshot);
      return assets;
    }
  };
};
function getGlobalRemoteInfo(moduleInfo, origin) {
  const hostGlobalSnapshot = getGlobalSnapshotInfoByModuleInfo({
    name: origin.name,
    version: origin.options.version
  });
  const globalRemoteInfo = hostGlobalSnapshot && "remotesInfo" in hostGlobalSnapshot && hostGlobalSnapshot.remotesInfo && getInfoWithoutType(hostGlobalSnapshot.remotesInfo, moduleInfo.name).value;
  if (globalRemoteInfo && globalRemoteInfo.matchedVersion) {
    return {
      hostGlobalSnapshot,
      globalSnapshot: getGlobalSnapshot(),
      remoteSnapshot: getGlobalSnapshotInfoByModuleInfo({
        name: moduleInfo.name,
        version: globalRemoteInfo.matchedVersion
      })
    };
  }
  return {
    hostGlobalSnapshot: void 0,
    globalSnapshot: getGlobalSnapshot(),
    remoteSnapshot: getGlobalSnapshotInfoByModuleInfo({
      name: moduleInfo.name,
      version: "version" in moduleInfo ? moduleInfo.version : void 0
    })
  };
}
class SnapshotHandler {
  constructor(HostInstance) {
    this.loadingHostSnapshot = null;
    this.manifestCache = /* @__PURE__ */ new Map();
    this.hooks = new PluginSystem({
      beforeLoadRemoteSnapshot: new AsyncHook("beforeLoadRemoteSnapshot"),
      loadSnapshot: new AsyncWaterfallHook("loadGlobalSnapshot"),
      loadRemoteSnapshot: new AsyncWaterfallHook("loadRemoteSnapshot"),
      afterLoadSnapshot: new AsyncWaterfallHook("afterLoadSnapshot")
    });
    this.manifestLoading = Global.__FEDERATION__.__MANIFEST_LOADING__;
    this.HostInstance = HostInstance;
    this.loaderHook = HostInstance.loaderHook;
  }
  // eslint-disable-next-line max-lines-per-function
  async loadRemoteSnapshotInfo({ moduleInfo, id, expose }) {
    const { options } = this.HostInstance;
    await this.hooks.lifecycle.beforeLoadRemoteSnapshot.emit({
      options,
      moduleInfo
    });
    let hostSnapshot = getGlobalSnapshotInfoByModuleInfo({
      name: this.HostInstance.options.name,
      version: this.HostInstance.options.version
    });
    if (!hostSnapshot) {
      hostSnapshot = {
        version: this.HostInstance.options.version || "",
        remoteEntry: "",
        remotesInfo: {}
      };
      addGlobalSnapshot({
        [this.HostInstance.options.name]: hostSnapshot
      });
    }
    if (hostSnapshot && "remotesInfo" in hostSnapshot && !getInfoWithoutType(hostSnapshot.remotesInfo, moduleInfo.name).value) {
      if ("version" in moduleInfo || "entry" in moduleInfo) {
        hostSnapshot.remotesInfo = {
          ...hostSnapshot?.remotesInfo,
          [moduleInfo.name]: {
            matchedVersion: "version" in moduleInfo ? moduleInfo.version : moduleInfo.entry
          }
        };
      }
    }
    const { hostGlobalSnapshot, remoteSnapshot, globalSnapshot } = this.getGlobalRemoteInfo(moduleInfo);
    const { remoteSnapshot: globalRemoteSnapshot, globalSnapshot: globalSnapshotRes } = await this.hooks.lifecycle.loadSnapshot.emit({
      options,
      moduleInfo,
      hostGlobalSnapshot,
      remoteSnapshot,
      globalSnapshot
    });
    let mSnapshot;
    let gSnapshot;
    if (globalRemoteSnapshot) {
      if (sdk.isManifestProvider(globalRemoteSnapshot)) {
        const remoteEntry = sdk.isBrowserEnv() ? globalRemoteSnapshot.remoteEntry : globalRemoteSnapshot.ssrRemoteEntry || globalRemoteSnapshot.remoteEntry || "";
        const moduleSnapshot = await this.getManifestJson(remoteEntry, moduleInfo, {});
        const globalSnapshotRes2 = setGlobalSnapshotInfoByModuleInfo({
          ...moduleInfo,
          // The global remote may be overridden
          // Therefore, set the snapshot key to the global address of the actual request
          entry: remoteEntry
        }, moduleSnapshot);
        mSnapshot = moduleSnapshot;
        gSnapshot = globalSnapshotRes2;
      } else {
        const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
          options: this.HostInstance.options,
          moduleInfo,
          remoteSnapshot: globalRemoteSnapshot,
          from: "global"
        });
        mSnapshot = remoteSnapshotRes;
        gSnapshot = globalSnapshotRes;
      }
    } else {
      if (isRemoteInfoWithEntry(moduleInfo)) {
        const moduleSnapshot = await this.getManifestJson(moduleInfo.entry, moduleInfo, {});
        const globalSnapshotRes2 = setGlobalSnapshotInfoByModuleInfo(moduleInfo, moduleSnapshot);
        const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
          options: this.HostInstance.options,
          moduleInfo,
          remoteSnapshot: moduleSnapshot,
          from: "global"
        });
        mSnapshot = remoteSnapshotRes;
        gSnapshot = globalSnapshotRes2;
      } else {
        error(errorCodes.getShortErrorMsg(errorCodes.RUNTIME_007, errorCodes.runtimeDescMap, {
          hostName: moduleInfo.name,
          hostVersion: moduleInfo.version,
          globalSnapshot: JSON.stringify(globalSnapshotRes)
        }));
      }
    }
    await this.hooks.lifecycle.afterLoadSnapshot.emit({
      id,
      host: this.HostInstance,
      options,
      moduleInfo,
      remoteSnapshot: mSnapshot
    });
    return {
      remoteSnapshot: mSnapshot,
      globalSnapshot: gSnapshot
    };
  }
  getGlobalRemoteInfo(moduleInfo) {
    return getGlobalRemoteInfo(moduleInfo, this.HostInstance);
  }
  async getManifestJson(manifestUrl, moduleInfo, extraOptions) {
    const getManifest = async () => {
      let manifestJson = this.manifestCache.get(manifestUrl);
      if (manifestJson) {
        return manifestJson;
      }
      try {
        let res = await this.loaderHook.lifecycle.fetch.emit(manifestUrl, {});
        if (!res || !(res instanceof Response)) {
          res = await fetch(manifestUrl, {});
        }
        manifestJson = await res.json();
      } catch (err) {
        manifestJson = await this.HostInstance.remoteHandler.hooks.lifecycle.errorLoadRemote.emit({
          id: manifestUrl,
          error: err,
          from: "runtime",
          lifecycle: "afterResolve",
          origin: this.HostInstance
        });
        if (!manifestJson) {
          delete this.manifestLoading[manifestUrl];
          error(errorCodes.getShortErrorMsg(errorCodes.RUNTIME_003, errorCodes.runtimeDescMap, {
            manifestUrl,
            moduleName: moduleInfo.name,
            hostName: this.HostInstance.options.name
          }, `${err}`));
        }
      }
      assert(manifestJson.metaData && manifestJson.exposes && manifestJson.shared, `${manifestUrl} is not a federation manifest`);
      this.manifestCache.set(manifestUrl, manifestJson);
      return manifestJson;
    };
    const asyncLoadProcess = async () => {
      const manifestJson = await getManifest();
      const remoteSnapshot = sdk.generateSnapshotFromManifest(manifestJson, {
        version: manifestUrl
      });
      const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
        options: this.HostInstance.options,
        moduleInfo,
        manifestJson,
        remoteSnapshot,
        manifestUrl,
        from: "manifest"
      });
      return remoteSnapshotRes;
    };
    if (!this.manifestLoading[manifestUrl]) {
      this.manifestLoading[manifestUrl] = asyncLoadProcess().then((res) => res);
    }
    return this.manifestLoading[manifestUrl];
  }
}
class SharedHandler {
  constructor(host) {
    this.hooks = new PluginSystem({
      beforeRegisterShare: new SyncWaterfallHook("beforeRegisterShare"),
      afterResolve: new AsyncWaterfallHook("afterResolve"),
      beforeLoadShare: new AsyncWaterfallHook("beforeLoadShare"),
      // not used yet
      loadShare: new AsyncHook(),
      resolveShare: new SyncWaterfallHook("resolveShare"),
      // maybe will change, temporarily for internal use only
      initContainerShareScopeMap: new SyncWaterfallHook("initContainerShareScopeMap")
    });
    this.host = host;
    this.shareScopeMap = {};
    this.initTokens = {};
    this._setGlobalShareScopeMap(host.options);
  }
  // register shared in shareScopeMap
  registerShared(globalOptions, userOptions) {
    const { newShareInfos, allShareInfos } = formatShareConfigs(globalOptions, userOptions);
    const sharedKeys = Object.keys(newShareInfos);
    sharedKeys.forEach((sharedKey) => {
      const sharedVals = newShareInfos[sharedKey];
      sharedVals.forEach((sharedVal) => {
        sharedVal.scope.forEach((sc) => {
          this.hooks.lifecycle.beforeRegisterShare.emit({
            origin: this.host,
            pkgName: sharedKey,
            shared: sharedVal
          });
          const registeredShared = this.shareScopeMap[sc]?.[sharedKey];
          if (!registeredShared) {
            this.setShared({
              pkgName: sharedKey,
              lib: sharedVal.lib,
              get: sharedVal.get,
              loaded: sharedVal.loaded || Boolean(sharedVal.lib),
              shared: sharedVal,
              from: userOptions.name
            });
          }
        });
      });
    });
    return {
      newShareInfos,
      allShareInfos
    };
  }
  async loadShare(pkgName, extraOptions) {
    const { host } = this;
    const shareOptions = getTargetSharedOptions({
      pkgName,
      extraOptions,
      shareInfos: host.options.shared
    });
    if (shareOptions?.scope) {
      await Promise.all(shareOptions.scope.map(async (shareScope) => {
        await Promise.all(this.initializeSharing(shareScope, {
          strategy: shareOptions.strategy
        }));
        return;
      }));
    }
    const loadShareRes = await this.hooks.lifecycle.beforeLoadShare.emit({
      pkgName,
      shareInfo: shareOptions,
      shared: host.options.shared,
      origin: host
    });
    const { shareInfo: shareOptionsRes } = loadShareRes;
    assert(shareOptionsRes, `Cannot find ${pkgName} Share in the ${host.options.name}. Please ensure that the ${pkgName} Share parameters have been injected`);
    const { shared: registeredShared, useTreesShaking } = getRegisteredShare(this.shareScopeMap, pkgName, shareOptionsRes, this.hooks.lifecycle.resolveShare) || {};
    if (registeredShared) {
      const targetShared = directShare(registeredShared, useTreesShaking);
      if (targetShared.lib) {
        addUseIn(targetShared, host.options.name);
        return targetShared.lib;
      } else if (targetShared.loading && !targetShared.loaded) {
        const factory = await targetShared.loading;
        targetShared.loaded = true;
        if (!targetShared.lib) {
          targetShared.lib = factory;
        }
        addUseIn(targetShared, host.options.name);
        return factory;
      } else {
        const asyncLoadProcess = async () => {
          const factory = await targetShared.get();
          addUseIn(targetShared, host.options.name);
          targetShared.loaded = true;
          targetShared.lib = factory;
          return factory;
        };
        const loading = asyncLoadProcess();
        this.setShared({
          pkgName,
          loaded: false,
          shared: registeredShared,
          from: host.options.name,
          lib: null,
          loading,
          treeShaking: useTreesShaking ? targetShared : void 0
        });
        return loading;
      }
    } else {
      if (extraOptions?.customShareInfo) {
        return false;
      }
      const _useTreeShaking = shouldUseTreeShaking(shareOptionsRes.treeShaking);
      const targetShared = directShare(shareOptionsRes, _useTreeShaking);
      const asyncLoadProcess = async () => {
        const factory = await targetShared.get();
        targetShared.lib = factory;
        targetShared.loaded = true;
        addUseIn(targetShared, host.options.name);
        const { shared: gShared, useTreesShaking: gUseTreeShaking } = getRegisteredShare(this.shareScopeMap, pkgName, shareOptionsRes, this.hooks.lifecycle.resolveShare) || {};
        if (gShared) {
          const targetGShared = directShare(gShared, gUseTreeShaking);
          targetGShared.lib = factory;
          targetGShared.loaded = true;
          gShared.from = shareOptionsRes.from;
        }
        return factory;
      };
      const loading = asyncLoadProcess();
      this.setShared({
        pkgName,
        loaded: false,
        shared: shareOptionsRes,
        from: host.options.name,
        lib: null,
        loading,
        treeShaking: _useTreeShaking ? targetShared : void 0
      });
      return loading;
    }
  }
  /**
   * This function initializes the sharing sequence (executed only once per share scope).
   * It accepts one argument, the name of the share scope.
   * If the share scope does not exist, it creates one.
   */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  initializeSharing(shareScopeName = DEFAULT_SCOPE, extraOptions) {
    const { host } = this;
    const from = extraOptions?.from;
    const strategy = extraOptions?.strategy;
    let initScope = extraOptions?.initScope;
    const promises = [];
    if (from !== "build") {
      const { initTokens } = this;
      if (!initScope)
        initScope = [];
      let initToken = initTokens[shareScopeName];
      if (!initToken)
        initToken = initTokens[shareScopeName] = { from: this.host.name };
      if (initScope.indexOf(initToken) >= 0)
        return promises;
      initScope.push(initToken);
    }
    const shareScope = this.shareScopeMap;
    const hostName = host.options.name;
    if (!shareScope[shareScopeName]) {
      shareScope[shareScopeName] = {};
    }
    const scope = shareScope[shareScopeName];
    const register = (name, shared) => {
      const { version, eager } = shared;
      scope[name] = scope[name] || {};
      const versions = scope[name];
      const activeVersion = versions[version] && directShare(versions[version]);
      const activeVersionEager = Boolean(activeVersion && ("eager" in activeVersion && activeVersion.eager || "shareConfig" in activeVersion && activeVersion.shareConfig?.eager));
      if (!activeVersion || activeVersion.strategy !== "loaded-first" && !activeVersion.loaded && (Boolean(!eager) !== !activeVersionEager ? eager : hostName > versions[version].from)) {
        versions[version] = shared;
      }
    };
    const initRemoteModule = async (key) => {
      const { module } = await host.remoteHandler.getRemoteModuleAndOptions({
        id: key
      });
      let remoteEntryExports = void 0;
      try {
        remoteEntryExports = await module.getEntry();
      } catch (error2) {
        remoteEntryExports = await host.remoteHandler.hooks.lifecycle.errorLoadRemote.emit({
          id: key,
          error: error2,
          from: "runtime",
          lifecycle: "beforeLoadShare",
          origin: host
        });
      } finally {
        if (remoteEntryExports?.init) {
          module.remoteEntryExports = remoteEntryExports;
          await module.init();
        }
      }
    };
    Object.keys(host.options.shared).forEach((shareName) => {
      const sharedArr = host.options.shared[shareName];
      sharedArr.forEach((shared) => {
        if (shared.scope.includes(shareScopeName)) {
          register(shareName, shared);
        }
      });
    });
    if (host.options.shareStrategy === "version-first" || strategy === "version-first") {
      host.options.remotes.forEach((remote) => {
        if (remote.shareScope === shareScopeName) {
          promises.push(initRemoteModule(remote.name));
        }
      });
    }
    return promises;
  }
  // The lib function will only be available if the shared set by eager or runtime init is set or the shared is successfully loaded.
  // 1. If the loaded shared already exists globally, then it will be reused
  // 2. If lib exists in local shared, it will be used directly
  // 3. If the local get returns something other than Promise, then it will be used directly
  loadShareSync(pkgName, extraOptions) {
    const { host } = this;
    const shareOptions = getTargetSharedOptions({
      pkgName,
      extraOptions,
      shareInfos: host.options.shared
    });
    if (shareOptions?.scope) {
      shareOptions.scope.forEach((shareScope) => {
        this.initializeSharing(shareScope, { strategy: shareOptions.strategy });
      });
    }
    const { shared: registeredShared, useTreesShaking } = getRegisteredShare(this.shareScopeMap, pkgName, shareOptions, this.hooks.lifecycle.resolveShare) || {};
    if (registeredShared) {
      if (typeof registeredShared.lib === "function") {
        addUseIn(registeredShared, host.options.name);
        if (!registeredShared.loaded) {
          registeredShared.loaded = true;
          if (registeredShared.from === host.options.name) {
            shareOptions.loaded = true;
          }
        }
        return registeredShared.lib;
      }
      if (typeof registeredShared.get === "function") {
        const module = registeredShared.get();
        if (!(module instanceof Promise)) {
          addUseIn(registeredShared, host.options.name);
          this.setShared({
            pkgName,
            loaded: true,
            from: host.options.name,
            lib: module,
            shared: registeredShared
          });
          return module;
        }
      }
    }
    if (shareOptions.lib) {
      if (!shareOptions.loaded) {
        shareOptions.loaded = true;
      }
      return shareOptions.lib;
    }
    if (shareOptions.get) {
      const module = shareOptions.get();
      if (module instanceof Promise) {
        const errorCode = extraOptions?.from === "build" ? errorCodes.RUNTIME_005 : errorCodes.RUNTIME_006;
        throw new Error(errorCodes.getShortErrorMsg(errorCode, errorCodes.runtimeDescMap, {
          hostName: host.options.name,
          sharedPkgName: pkgName
        }));
      }
      shareOptions.lib = module;
      this.setShared({
        pkgName,
        loaded: true,
        from: host.options.name,
        lib: shareOptions.lib,
        shared: shareOptions
      });
      return shareOptions.lib;
    }
    throw new Error(errorCodes.getShortErrorMsg(errorCodes.RUNTIME_006, errorCodes.runtimeDescMap, {
      hostName: host.options.name,
      sharedPkgName: pkgName
    }));
  }
  initShareScopeMap(scopeName, shareScope, extraOptions = {}) {
    const { host } = this;
    this.shareScopeMap[scopeName] = shareScope;
    this.hooks.lifecycle.initContainerShareScopeMap.emit({
      shareScope,
      options: host.options,
      origin: host,
      scopeName,
      hostShareScopeMap: extraOptions.hostShareScopeMap
    });
  }
  setShared({ pkgName, shared, from, lib, loading, loaded, get, treeShaking }) {
    const { version, scope = "default", ...shareInfo } = shared;
    const scopes = Array.isArray(scope) ? scope : [scope];
    const mergeAttrs = (shared2) => {
      const merge = (s, key, val) => {
        if (val && !s[key]) {
          s[key] = val;
        }
      };
      const targetShared = treeShaking ? shared2.treeShaking : shared2;
      merge(targetShared, "loaded", loaded);
      merge(targetShared, "loading", loading);
      merge(targetShared, "get", get);
    };
    scopes.forEach((sc) => {
      if (!this.shareScopeMap[sc]) {
        this.shareScopeMap[sc] = {};
      }
      if (!this.shareScopeMap[sc][pkgName]) {
        this.shareScopeMap[sc][pkgName] = {};
      }
      if (!this.shareScopeMap[sc][pkgName][version]) {
        this.shareScopeMap[sc][pkgName][version] = {
          version,
          scope: [sc],
          ...shareInfo,
          lib
        };
      }
      const registeredShared = this.shareScopeMap[sc][pkgName][version];
      mergeAttrs(registeredShared);
      if (from && registeredShared.from !== from) {
        registeredShared.from = from;
      }
    });
  }
  _setGlobalShareScopeMap(hostOptions) {
    const globalShareScopeMap = getGlobalShareScope();
    const identifier = hostOptions.id || hostOptions.name;
    if (identifier && !globalShareScopeMap[identifier]) {
      globalShareScopeMap[identifier] = this.shareScopeMap;
    }
  }
}
class RemoteHandler {
  constructor(host) {
    this.hooks = new PluginSystem({
      beforeRegisterRemote: new SyncWaterfallHook("beforeRegisterRemote"),
      registerRemote: new SyncWaterfallHook("registerRemote"),
      beforeRequest: new AsyncWaterfallHook("beforeRequest"),
      onLoad: new AsyncHook("onLoad"),
      handlePreloadModule: new SyncHook("handlePreloadModule"),
      errorLoadRemote: new AsyncHook("errorLoadRemote"),
      beforePreloadRemote: new AsyncHook("beforePreloadRemote"),
      generatePreloadAssets: new AsyncHook("generatePreloadAssets"),
      // not used yet
      afterPreloadRemote: new AsyncHook(),
      // TODO: Move to loaderHook
      loadEntry: new AsyncHook()
    });
    this.host = host;
    this.idToRemoteMap = {};
  }
  formatAndRegisterRemote(globalOptions, userOptions) {
    const userRemotes = userOptions.remotes || [];
    return userRemotes.reduce((res, remote) => {
      this.registerRemote(remote, res, { force: false });
      return res;
    }, globalOptions.remotes);
  }
  setIdToRemoteMap(id, remoteMatchInfo) {
    const { remote, expose } = remoteMatchInfo;
    const { name, alias } = remote;
    this.idToRemoteMap[id] = { name: remote.name, expose };
    if (alias && id.startsWith(name)) {
      const idWithAlias = id.replace(name, alias);
      this.idToRemoteMap[idWithAlias] = { name: remote.name, expose };
      return;
    }
    if (alias && id.startsWith(alias)) {
      const idWithName = id.replace(alias, name);
      this.idToRemoteMap[idWithName] = { name: remote.name, expose };
    }
  }
  // eslint-disable-next-line max-lines-per-function
  // eslint-disable-next-line @typescript-eslint/member-ordering
  async loadRemote(id, options) {
    const { host } = this;
    try {
      const { loadFactory = true } = options || {
        loadFactory: true
      };
      const { module, moduleOptions, remoteMatchInfo } = await this.getRemoteModuleAndOptions({
        id
      });
      const { pkgNameOrAlias, remote, expose, id: idRes, remoteSnapshot } = remoteMatchInfo;
      const moduleOrFactory = await module.get(idRes, expose, options, remoteSnapshot);
      const moduleWrapper = await this.hooks.lifecycle.onLoad.emit({
        id: idRes,
        pkgNameOrAlias,
        expose,
        exposeModule: loadFactory ? moduleOrFactory : void 0,
        exposeModuleFactory: loadFactory ? void 0 : moduleOrFactory,
        remote,
        options: moduleOptions,
        moduleInstance: module,
        origin: host
      });
      this.setIdToRemoteMap(id, remoteMatchInfo);
      if (typeof moduleWrapper === "function") {
        return moduleWrapper;
      }
      return moduleOrFactory;
    } catch (error2) {
      const { from = "runtime" } = options || { from: "runtime" };
      const failOver = await this.hooks.lifecycle.errorLoadRemote.emit({
        id,
        error: error2,
        from,
        lifecycle: "onLoad",
        origin: host
      });
      if (!failOver) {
        throw error2;
      }
      return failOver;
    }
  }
  // eslint-disable-next-line @typescript-eslint/member-ordering
  async preloadRemote(preloadOptions) {
    const { host } = this;
    await this.hooks.lifecycle.beforePreloadRemote.emit({
      preloadOps: preloadOptions,
      options: host.options,
      origin: host
    });
    const preloadOps = formatPreloadArgs(host.options.remotes, preloadOptions);
    await Promise.all(preloadOps.map(async (ops) => {
      const { remote } = ops;
      const remoteInfo = getRemoteInfo(remote);
      const { globalSnapshot, remoteSnapshot } = await host.snapshotHandler.loadRemoteSnapshotInfo({
        moduleInfo: remote
      });
      const assets = await this.hooks.lifecycle.generatePreloadAssets.emit({
        origin: host,
        preloadOptions: ops,
        remote,
        remoteInfo,
        globalSnapshot,
        remoteSnapshot
      });
      if (!assets) {
        return;
      }
      preloadAssets(remoteInfo, host, assets);
    }));
  }
  registerRemotes(remotes, options) {
    const { host } = this;
    remotes.forEach((remote) => {
      this.registerRemote(remote, host.options.remotes, {
        force: options?.force
      });
    });
  }
  async getRemoteModuleAndOptions(options) {
    const { host } = this;
    const { id } = options;
    let loadRemoteArgs;
    try {
      loadRemoteArgs = await this.hooks.lifecycle.beforeRequest.emit({
        id,
        options: host.options,
        origin: host
      });
    } catch (error2) {
      loadRemoteArgs = await this.hooks.lifecycle.errorLoadRemote.emit({
        id,
        options: host.options,
        origin: host,
        from: "runtime",
        error: error2,
        lifecycle: "beforeRequest"
      });
      if (!loadRemoteArgs) {
        throw error2;
      }
    }
    const { id: idRes } = loadRemoteArgs;
    const remoteSplitInfo = matchRemoteWithNameAndExpose(host.options.remotes, idRes);
    assert(remoteSplitInfo, errorCodes.getShortErrorMsg(errorCodes.RUNTIME_004, errorCodes.runtimeDescMap, {
      hostName: host.options.name,
      requestId: idRes
    }));
    const { remote: rawRemote } = remoteSplitInfo;
    const remoteInfo = getRemoteInfo(rawRemote);
    const matchInfo = await host.sharedHandler.hooks.lifecycle.afterResolve.emit({
      id: idRes,
      ...remoteSplitInfo,
      options: host.options,
      origin: host,
      remoteInfo
    });
    const { remote, expose } = matchInfo;
    assert(remote && expose, `The 'beforeRequest' hook was executed, but it failed to return the correct 'remote' and 'expose' values while loading ${idRes}.`);
    let module = host.moduleCache.get(remote.name);
    const moduleOptions = {
      host,
      remoteInfo
    };
    if (!module) {
      module = new Module(moduleOptions);
      host.moduleCache.set(remote.name, module);
    }
    return {
      module,
      moduleOptions,
      remoteMatchInfo: matchInfo
    };
  }
  registerRemote(remote, targetRemotes, options) {
    const { host } = this;
    const normalizeRemote = () => {
      if (remote.alias) {
        const findEqual = targetRemotes.find((item) => remote.alias && (item.name.startsWith(remote.alias) || item.alias?.startsWith(remote.alias)));
        assert(!findEqual, `The alias ${remote.alias} of remote ${remote.name} is not allowed to be the prefix of ${findEqual && findEqual.name} name or alias`);
      }
      if ("entry" in remote) {
        if (sdk.isBrowserEnv() && !remote.entry.startsWith("http")) {
          remote.entry = new URL(remote.entry, window.location.origin).href;
        }
      }
      if (!remote.shareScope) {
        remote.shareScope = DEFAULT_SCOPE;
      }
      if (!remote.type) {
        remote.type = DEFAULT_REMOTE_TYPE;
      }
    };
    this.hooks.lifecycle.beforeRegisterRemote.emit({ remote, origin: host });
    const registeredRemote = targetRemotes.find((item) => item.name === remote.name);
    if (!registeredRemote) {
      normalizeRemote();
      targetRemotes.push(remote);
      this.hooks.lifecycle.registerRemote.emit({ remote, origin: host });
    } else {
      const messages = [
        `The remote "${remote.name}" is already registered.`,
        "Please note that overriding it may cause unexpected errors."
      ];
      if (options?.force) {
        this.removeRemote(registeredRemote);
        normalizeRemote();
        targetRemotes.push(remote);
        this.hooks.lifecycle.registerRemote.emit({ remote, origin: host });
        sdk.warn(messages.join(" "));
      }
    }
  }
  removeRemote(remote) {
    try {
      const { host } = this;
      const { name } = remote;
      const remoteIndex = host.options.remotes.findIndex((item) => item.name === name);
      if (remoteIndex !== -1) {
        host.options.remotes.splice(remoteIndex, 1);
      }
      const loadedModule = host.moduleCache.get(remote.name);
      if (loadedModule) {
        const remoteInfo = loadedModule.remoteInfo;
        const key = remoteInfo.entryGlobalName;
        if (CurrentGlobal[key]) {
          if (Object.getOwnPropertyDescriptor(CurrentGlobal, key)?.configurable) {
            delete CurrentGlobal[key];
          } else {
            CurrentGlobal[key] = void 0;
          }
        }
        const remoteEntryUniqueKey = getRemoteEntryUniqueKey(loadedModule.remoteInfo);
        if (globalLoading[remoteEntryUniqueKey]) {
          delete globalLoading[remoteEntryUniqueKey];
        }
        host.snapshotHandler.manifestCache.delete(remoteInfo.entry);
        let remoteInsId = remoteInfo.buildVersion ? sdk.composeKeyWithSeparator(remoteInfo.name, remoteInfo.buildVersion) : remoteInfo.name;
        const remoteInsIndex = CurrentGlobal.__FEDERATION__.__INSTANCES__.findIndex((ins) => {
          if (remoteInfo.buildVersion) {
            return ins.options.id === remoteInsId;
          } else {
            return ins.name === remoteInsId;
          }
        });
        if (remoteInsIndex !== -1) {
          const remoteIns = CurrentGlobal.__FEDERATION__.__INSTANCES__[remoteInsIndex];
          remoteInsId = remoteIns.options.id || remoteInsId;
          const globalShareScopeMap = getGlobalShareScope();
          let isAllSharedNotUsed = true;
          const needDeleteKeys = [];
          Object.keys(globalShareScopeMap).forEach((instId) => {
            const shareScopeMap = globalShareScopeMap[instId];
            shareScopeMap && Object.keys(shareScopeMap).forEach((shareScope) => {
              const shareScopeVal = shareScopeMap[shareScope];
              shareScopeVal && Object.keys(shareScopeVal).forEach((shareName) => {
                const sharedPkgs = shareScopeVal[shareName];
                sharedPkgs && Object.keys(sharedPkgs).forEach((shareVersion) => {
                  const shared = sharedPkgs[shareVersion];
                  if (shared && typeof shared === "object" && shared.from === remoteInfo.name) {
                    if (shared.loaded || shared.loading) {
                      shared.useIn = shared.useIn.filter((usedHostName) => usedHostName !== remoteInfo.name);
                      if (shared.useIn.length) {
                        isAllSharedNotUsed = false;
                      } else {
                        needDeleteKeys.push([
                          instId,
                          shareScope,
                          shareName,
                          shareVersion
                        ]);
                      }
                    } else {
                      needDeleteKeys.push([
                        instId,
                        shareScope,
                        shareName,
                        shareVersion
                      ]);
                    }
                  }
                });
              });
            });
          });
          if (isAllSharedNotUsed) {
            remoteIns.shareScopeMap = {};
            delete globalShareScopeMap[remoteInsId];
          }
          needDeleteKeys.forEach(([insId, shareScope, shareName, shareVersion]) => {
            delete globalShareScopeMap[insId]?.[shareScope]?.[shareName]?.[shareVersion];
          });
          CurrentGlobal.__FEDERATION__.__INSTANCES__.splice(remoteInsIndex, 1);
        }
        const { hostGlobalSnapshot } = getGlobalRemoteInfo(remote, host);
        if (hostGlobalSnapshot) {
          const remoteKey = hostGlobalSnapshot && "remotesInfo" in hostGlobalSnapshot && hostGlobalSnapshot.remotesInfo && getInfoWithoutType(hostGlobalSnapshot.remotesInfo, remote.name).key;
          if (remoteKey) {
            delete hostGlobalSnapshot.remotesInfo[remoteKey];
            if (
              //eslint-disable-next-line no-extra-boolean-cast
              Boolean(Global.__FEDERATION__.__MANIFEST_LOADING__[remoteKey])
            ) {
              delete Global.__FEDERATION__.__MANIFEST_LOADING__[remoteKey];
            }
          }
        }
        host.moduleCache.delete(remote.name);
      }
    } catch (err) {
      logger.log("removeRemote fail: ", err);
    }
  }
}
const USE_SNAPSHOT = typeof FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN === "boolean" ? !FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN : true;
class ModuleFederation {
  constructor(userOptions) {
    this.hooks = new PluginSystem({
      beforeInit: new SyncWaterfallHook("beforeInit"),
      init: new SyncHook(),
      // maybe will change, temporarily for internal use only
      beforeInitContainer: new AsyncWaterfallHook("beforeInitContainer"),
      // maybe will change, temporarily for internal use only
      initContainer: new AsyncWaterfallHook("initContainer")
    });
    this.version = "2.0.1";
    this.moduleCache = /* @__PURE__ */ new Map();
    this.loaderHook = new PluginSystem({
      // FIXME: may not be suitable , not open to the public yet
      getModuleInfo: new SyncHook(),
      createScript: new SyncHook(),
      createLink: new SyncHook(),
      fetch: new AsyncHook(),
      loadEntryError: new AsyncHook(),
      getModuleFactory: new AsyncHook()
    });
    this.bridgeHook = new PluginSystem({
      beforeBridgeRender: new SyncHook(),
      afterBridgeRender: new SyncHook(),
      beforeBridgeDestroy: new SyncHook(),
      afterBridgeDestroy: new SyncHook()
    });
    const plugins = USE_SNAPSHOT ? [snapshotPlugin(), generatePreloadAssetsPlugin()] : [];
    const defaultOptions = {
      id: getBuilderId$1(),
      name: userOptions.name,
      plugins,
      remotes: [],
      shared: {},
      inBrowser: sdk.isBrowserEnv()
    };
    this.name = userOptions.name;
    this.options = defaultOptions;
    this.snapshotHandler = new SnapshotHandler(this);
    this.sharedHandler = new SharedHandler(this);
    this.remoteHandler = new RemoteHandler(this);
    this.shareScopeMap = this.sharedHandler.shareScopeMap;
    this.registerPlugins([
      ...defaultOptions.plugins,
      ...userOptions.plugins || []
    ]);
    this.options = this.formatOptions(defaultOptions, userOptions);
  }
  initOptions(userOptions) {
    this.registerPlugins(userOptions.plugins);
    const options = this.formatOptions(this.options, userOptions);
    this.options = options;
    return options;
  }
  async loadShare(pkgName, extraOptions) {
    return this.sharedHandler.loadShare(pkgName, extraOptions);
  }
  // The lib function will only be available if the shared set by eager or runtime init is set or the shared is successfully loaded.
  // 1. If the loaded shared already exists globally, then it will be reused
  // 2. If lib exists in local shared, it will be used directly
  // 3. If the local get returns something other than Promise, then it will be used directly
  loadShareSync(pkgName, extraOptions) {
    return this.sharedHandler.loadShareSync(pkgName, extraOptions);
  }
  initializeSharing(shareScopeName = DEFAULT_SCOPE, extraOptions) {
    return this.sharedHandler.initializeSharing(shareScopeName, extraOptions);
  }
  initRawContainer(name, url, container) {
    const remoteInfo = getRemoteInfo({ name, entry: url });
    const module = new Module({ host: this, remoteInfo });
    module.remoteEntryExports = container;
    this.moduleCache.set(name, module);
    return module;
  }
  // eslint-disable-next-line max-lines-per-function
  // eslint-disable-next-line @typescript-eslint/member-ordering
  async loadRemote(id, options) {
    return this.remoteHandler.loadRemote(id, options);
  }
  // eslint-disable-next-line @typescript-eslint/member-ordering
  async preloadRemote(preloadOptions) {
    return this.remoteHandler.preloadRemote(preloadOptions);
  }
  initShareScopeMap(scopeName, shareScope, extraOptions = {}) {
    this.sharedHandler.initShareScopeMap(scopeName, shareScope, extraOptions);
  }
  formatOptions(globalOptions, userOptions) {
    const { allShareInfos: shared } = formatShareConfigs(globalOptions, userOptions);
    const { userOptions: userOptionsRes, options: globalOptionsRes } = this.hooks.lifecycle.beforeInit.emit({
      origin: this,
      userOptions,
      options: globalOptions,
      shareInfo: shared
    });
    const remotes = this.remoteHandler.formatAndRegisterRemote(globalOptionsRes, userOptionsRes);
    const { allShareInfos } = this.sharedHandler.registerShared(globalOptionsRes, userOptionsRes);
    const plugins = [...globalOptionsRes.plugins];
    if (userOptionsRes.plugins) {
      userOptionsRes.plugins.forEach((plugin) => {
        if (!plugins.includes(plugin)) {
          plugins.push(plugin);
        }
      });
    }
    const optionsRes = {
      ...globalOptions,
      ...userOptions,
      plugins,
      remotes,
      shared: allShareInfos
    };
    this.hooks.lifecycle.init.emit({
      origin: this,
      options: optionsRes
    });
    return optionsRes;
  }
  registerPlugins(plugins) {
    const pluginRes = registerPlugins(plugins, this);
    this.options.plugins = this.options.plugins.reduce((res, plugin) => {
      if (!plugin)
        return res;
      if (res && !res.find((item) => item.name === plugin.name)) {
        res.push(plugin);
      }
      return res;
    }, pluginRes || []);
  }
  registerRemotes(remotes, options) {
    return this.remoteHandler.registerRemotes(remotes, options);
  }
  registerShared(shared) {
    this.sharedHandler.registerShared(this.options, {
      ...this.options,
      shared
    });
  }
}
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
index_cjs$2.loadScript = sdk.loadScript;
index_cjs$2.loadScriptNode = sdk.loadScriptNode;
index_cjs$2.CurrentGlobal = CurrentGlobal;
index_cjs$2.Global = Global;
index_cjs$2.Module = Module;
index_cjs$2.ModuleFederation = ModuleFederation;
index_cjs$2.addGlobalSnapshot = addGlobalSnapshot;
index_cjs$2.assert = assert;
index_cjs$2.getGlobalFederationConstructor = getGlobalFederationConstructor;
index_cjs$2.getGlobalSnapshot = getGlobalSnapshot;
index_cjs$2.getInfoWithoutType = getInfoWithoutType;
index_cjs$2.getRegisteredShare = getRegisteredShare;
index_cjs$2.getRemoteEntry = getRemoteEntry;
index_cjs$2.getRemoteInfo = getRemoteInfo;
index_cjs$2.helpers = helpers;
index_cjs$2.isStaticResourcesEqual = isStaticResourcesEqual;
index_cjs$2.matchRemoteWithNameAndExpose = matchRemoteWithNameAndExpose;
index_cjs$2.registerGlobalPlugins = registerGlobalPlugins;
index_cjs$2.resetFederationGlobalInfo = resetFederationGlobalInfo;
index_cjs$2.safeWrapper = safeWrapper;
index_cjs$2.satisfy = satisfy;
index_cjs$2.setGlobalFederationConstructor = setGlobalFederationConstructor;
index_cjs$2.setGlobalFederationInstance = setGlobalFederationInstance;
index_cjs$2.types = index;

var utils_cjs = {};

var runtimeCore$1 = index_cjs$2;

// injected by bundler, so it can not use runtime-core stuff
function getBuilderId() {
    //@ts-ignore
    return typeof FEDERATION_BUILD_IDENTIFIER !== 'undefined'
        ? //@ts-ignore
            FEDERATION_BUILD_IDENTIFIER
        : '';
}
function getGlobalFederationInstance(name, version) {
    const buildId = getBuilderId();
    return runtimeCore$1.CurrentGlobal.__FEDERATION__.__INSTANCES__.find((GMInstance) => {
        if (buildId && GMInstance.options.id === buildId) {
            return true;
        }
        if (GMInstance.options.name === name &&
            !GMInstance.options.version &&
            !version) {
            return true;
        }
        if (GMInstance.options.name === name &&
            version &&
            GMInstance.options.version === version) {
            return true;
        }
        return false;
    });
}

utils_cjs.getGlobalFederationInstance = getGlobalFederationInstance;

var runtimeCore = index_cjs$2;
var utils = utils_cjs;

function createInstance(options) {
    // Retrieve debug constructor
    const ModuleFederationConstructor = runtimeCore.getGlobalFederationConstructor() || runtimeCore.ModuleFederation;
    const instance = new ModuleFederationConstructor(options);
    runtimeCore.setGlobalFederationInstance(instance);
    return instance;
}
let FederationInstance = null;
/**
 * @deprecated Use createInstance or getInstance instead
 */
function init(options) {
    // Retrieve the same instance with the same name
    const instance = utils.getGlobalFederationInstance(options.name, options.version);
    if (!instance) {
        FederationInstance = createInstance(options);
        return FederationInstance;
    }
    else {
        // Merge options
        instance.initOptions(options);
        if (!FederationInstance) {
            FederationInstance = instance;
        }
        return instance;
    }
}
// Inject for debug
runtimeCore.setGlobalFederationConstructor(runtimeCore.ModuleFederation);

runtimeCore.Module;
runtimeCore.ModuleFederation;
runtimeCore.getRemoteEntry;
runtimeCore.getRemoteInfo;
runtimeCore.loadScript;
runtimeCore.loadScriptNode;
runtimeCore.registerGlobalPlugins;
var init_1 = init;

export { init_1 as i };
