import React from 'react';
import ReactDOM from 'react-dom/client';

import { AdminAcessosRemoteApp } from './remote-app';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminAcessosRemoteApp bffBaseUrl="https://api-authpoc.tasso.dev.br" />
  </React.StrictMode>
);