import type {
  MicrofrontendCatalogItem,
  RemoteBootstrapModule
} from '@zcorp/shared-contracts';
import { createInstance, type ModuleFederation } from '@module-federation/runtime';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as ReactDomClient from 'react-dom/client';
import * as ReactJsxRuntime from 'react/jsx-runtime';

function createFederationRuntime(): ModuleFederation {
  return createInstance({
    name: 'frontendShellRuntime',
    remotes: [],
    shared: {
      react: {
        version: React.version,
        lib: () => React,
        shareConfig: {
          singleton: true,
          requiredVersion: false
        }
      },
      'react-dom': {
        version: ReactDom.version,
        lib: () => ReactDom,
        shareConfig: {
          singleton: true,
          requiredVersion: false
        }
      },
      'react-dom/client': {
        version: ReactDom.version,
        lib: () => ReactDomClient,
        shareConfig: {
          singleton: true,
          requiredVersion: false
        }
      },
      'react/jsx-runtime': {
        version: React.version,
        lib: () => ReactJsxRuntime,
        shareConfig: {
          singleton: true,
          requiredVersion: false
        }
      }
    }
  });
}

function normalizeExposedModule(moduleId: string): string {
  return moduleId === '.' ? moduleId : moduleId.replace(/^\.\//, '');
}

function toRuntimeModuleId(remote: MicrofrontendCatalogItem): string {
  return `${remote.scope}/${normalizeExposedModule(remote.module)}`;
}

function toRuntimeRemote(remote: MicrofrontendCatalogItem) {
  return {
    name: remote.scope,
    alias: remote.id,
    entry: remote.entry,
    entryGlobalName: remote.scope,
    shareScope: 'default',
    type: 'module' as const
  };
}

function unwrapRemoteBootstrap(moduleValue: unknown): RemoteBootstrapModule {
  const candidate =
    moduleValue && typeof moduleValue === 'object' && 'default' in moduleValue
      ? (moduleValue as { default: unknown }).default
      : moduleValue;

  if (!candidate || typeof candidate !== 'object') {
    throw new Error('O runtime federado retornou um modulo remoto invalido.');
  }

  if (!('mount' in candidate) || typeof candidate.mount !== 'function') {
    throw new Error('O modulo remoto autorizado nao expoe um bootstrap valido.');
  }

  return candidate as RemoteBootstrapModule;
}

let federationRuntime = createFederationRuntime();
const registeredRemoteEntries = new Map<string, string>();

export async function registerRemote(remote: MicrofrontendCatalogItem): Promise<void> {
  const runtimeRemote = toRuntimeRemote(remote);
  const currentEntry = registeredRemoteEntries.get(runtimeRemote.name);

  if (currentEntry === runtimeRemote.entry) {
    return;
  }

  federationRuntime.registerRemotes([runtimeRemote], {
    force: currentEntry !== undefined
  });
  registeredRemoteEntries.set(runtimeRemote.name, runtimeRemote.entry);
}

export async function loadRemoteBootstrap(remote: MicrofrontendCatalogItem): Promise<RemoteBootstrapModule> {
  await registerRemote(remote);

  const remoteModule = await federationRuntime.loadRemote<RemoteBootstrapModule | { default: RemoteBootstrapModule }>(
    toRuntimeModuleId(remote),
    {
      from: 'runtime'
    }
  );

  if (!remoteModule) {
    throw new Error(`O runtime federado nao conseguiu resolver ${remote.id}.`);
  }

  return unwrapRemoteBootstrap(remoteModule);
}

export function resetRegisteredRemotes(): void {
  registeredRemoteEntries.clear();
  federationRuntime = createFederationRuntime();
}