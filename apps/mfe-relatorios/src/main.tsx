import { PERMISSION_SNAPSHOT_FIXTURE } from '@zcorp/shared-contracts';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { RelatoriosRemoteApp } from './remote-app';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RelatoriosRemoteApp snapshot={PERMISSION_SNAPSHOT_FIXTURE} />
  </React.StrictMode>
);