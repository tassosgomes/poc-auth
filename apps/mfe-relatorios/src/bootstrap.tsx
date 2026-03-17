import type {
  RemoteBootstrapModule,
  RemoteBootstrapProps
} from '@zcorp/shared-contracts';
import { MICROFRONTEND_CATALOG_SEED } from '@zcorp/shared-contracts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { RelatoriosRemoteApp } from './remote-app';
import './styles.css';

const manifest = MICROFRONTEND_CATALOG_SEED.find((item) => item.id === 'mfe-relatorios');

if (!manifest) {
  throw new Error('Manifesto do mfe-relatorios nao encontrado no contrato compartilhado.');
}

async function mount(container: HTMLElement, props: RemoteBootstrapProps): Promise<() => void> {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <RelatoriosRemoteApp snapshot={props.snapshot} />
    </StrictMode>
  );

  return () => {
    root.unmount();
  };
}

const bootstrap: RemoteBootstrapModule = {
  manifest,
  mount
};

export { manifest, mount };
export default bootstrap;