import { createServer } from 'node:http';

const shellOrigin = 'http://127.0.0.1:4173';
const bffPort = 6201;
const remotePort = 6202;

const permissionSnapshot = {
  userId: 'user-e2e',
  roles: ['coordenador'],
  permissions: ['dashboard:view'],
  screens: ['dashboard'],
  routes: ['/dashboard'],
  microfrontends: [
    {
      id: 'mfe-dashboard',
      route: '/dashboard',
      entry: `http://127.0.0.1:${remotePort}/dashboard/remoteEntry.js`,
      scope: 'mfeDashboardRuntime',
      module: './bootstrap',
      requiredPermissions: ['dashboard:view']
    }
  ],
  generatedAt: '2026-03-17T00:00:00.000Z',
  version: 1
};

function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    'content-type': 'application/json',
    ...extraHeaders
  });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
    ...extraHeaders
  });
  response.end(body);
}

function buildRemoteEntry(scope, manifest) {
  return `const manifest = ${JSON.stringify(manifest)};
const bootstrap = {
  manifest,
  mount(container, props) {
    const content = document.createElement('div');
    content.textContent = 'Remote ' + props.route + ' carregado pelo runtime autorizado';
    container.replaceChildren(content);
    return () => {
      container.replaceChildren();
    };
  }
};
export function get(module) {
  if (module !== './bootstrap') {
    throw new Error('Modulo remoto nao encontrado para ' + module + ' em ${scope}.');
  }
  return () => ({ default: bootstrap });
}
export async function init() {}
`;
}

const remoteEntries = new Map([
  [
    '/dashboard/remoteEntry.js',
    buildRemoteEntry('mfeDashboardRuntime', permissionSnapshot.microfrontends[0])
  ]
]);

const corsHeaders = {
  'access-control-allow-origin': shellOrigin,
  'access-control-allow-credentials': 'true'
};

const bffServer = createServer((request, response) => {
  if (!request.url) {
    sendText(response, 400, 'missing-url');
    return;
  }

  if (request.url === '/healthz') {
    sendText(response, 200, 'ok', corsHeaders);
    return;
  }

  if (request.url === '/api/permissions') {
    sendJson(response, 200, permissionSnapshot, corsHeaders);
    return;
  }

  sendJson(
    response,
    404,
    {
      code: 'UPSTREAM_ERROR',
      message: 'Endpoint nao configurado no mock E2E.',
      status: 404,
      timestamp: '2026-03-17T00:00:00.000Z'
    },
    corsHeaders
  );
});

const remoteServer = createServer((request, response) => {
  const requestUrl = request.url ?? '/';
  const entry = remoteEntries.get(requestUrl);

  if (entry) {
    response.writeHead(200, {
      'content-type': 'application/javascript; charset=utf-8',
      'access-control-allow-origin': '*'
    });
    response.end(entry);
    return;
  }

  if (requestUrl.endsWith('/remoteEntry.js')) {
    sendText(response, 410, 'remote-entry-not-authorized', {
      'access-control-allow-origin': '*'
    });
    return;
  }

  sendText(response, 404, 'not-found', {
    'access-control-allow-origin': '*'
  });
});

let closed = false;

function closeServers() {
  if (closed) {
    return;
  }

  closed = true;
  bffServer.close();
  remoteServer.close();
}

process.on('SIGINT', () => {
  closeServers();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeServers();
  process.exit(0);
});

bffServer.listen(bffPort, '127.0.0.1');
remoteServer.listen(remotePort, '127.0.0.1');