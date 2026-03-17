import { BFF_ERROR_FIXTURE, PERMISSION_SNAPSHOT_FIXTURE } from '@zcorp/shared-contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

const { loadAuthorizedRemoteMock } = vi.hoisted(() => ({
  loadAuthorizedRemoteMock: vi.fn()
}));

vi.mock('../remote-loader', () => ({
  UnauthorizedRemoteError: class UnauthorizedRemoteError extends Error {
    constructor(message: string, public readonly route: string) {
      super(message);
      this.name = 'UnauthorizedRemoteError';
    }
  },
  loadAuthorizedRemote: loadAuthorizedRemoteMock
}));

import { App } from '../app';
import * as api from '../api';
import { SessionProvider } from '../session';

function renderAppAt(pathname: string): void {
  window.history.pushState({}, '', pathname);

  render(
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  });
}

describe('frontend shell bootstrap and guards', () => {
  const fetchMock = vi.fn();
  const redirectToLoginSpy = vi.spyOn(api, 'redirectToLogin').mockImplementation(() => {});

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    redirectToLoginSpy.mockClear();
    loadAuthorizedRemoteMock.mockReset();
    loadAuthorizedRemoteMock.mockResolvedValue({
      manifest: PERMISSION_SNAPSHOT_FIXTURE.microfrontends[0],
      mount: (container: HTMLElement, props: { route: string }) => {
        container.textContent = `Remote ${props.route} carregado`;
        return () => {
          container.textContent = '';
        };
      }
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  it('bootstraps the session and renders only authorized navigation items', async () => {
    fetchMock.mockResolvedValue(jsonResponse(PERMISSION_SNAPSHOT_FIXTURE));

    renderAppAt('/dashboard');

    expect(await screen.findByRole('navigation', { name: 'Navegacao principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard operacional/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Administracao de acessos/i })).toBeInTheDocument();
    expect(screen.getByText('user-123')).toBeInTheDocument();
    expect(await screen.findByText('Remote /dashboard carregado')).toBeInTheDocument();
    expect(loadAuthorizedRemoteMock).toHaveBeenCalledWith(PERMISSION_SNAPSHOT_FIXTURE, '/dashboard');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api-authpoc.tasso.dev.br/api/permissions',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('shows a clear expired-session state on bootstrap 401', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          ...BFF_ERROR_FIXTURE,
          code: 'SESSION_EXPIRED',
          message: 'Session expired',
          status: 401
        },
        401
      )
    );

    renderAppAt('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Sua sessao nao esta mais valida' })).toBeInTheDocument();
    expect(redirectToLoginSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Iniciar novo login' })).toHaveAttribute(
      'href',
      'https://api-authpoc.tasso.dev.br/api/auth/login'
    );
  });

  it('exposes the bootstrap 403 state at the root entrypoint', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          ...BFF_ERROR_FIXTURE,
          code: 'ACCESS_DENIED',
          message: 'Forbidden',
          status: 403
        },
        403
      )
    );

    renderAppAt('/');

    expect(await screen.findByRole('heading', { name: 'O BFF recusou o bootstrap desta sessao' })).toBeInTheDocument();
    expect(screen.getByText('As roles efetivas nao concedem acesso ao shell solicitado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Autenticar novamente' })).toHaveAttribute(
      'href',
      'https://api-authpoc.tasso.dev.br/api/auth/login'
    );
  });

  it('blocks manual navigation to a route not present in the permission snapshot', async () => {
    const restrictedSnapshot = {
      ...PERMISSION_SNAPSHOT_FIXTURE,
      permissions: ['dashboard:view'],
      screens: ['dashboard'],
      routes: ['/dashboard'],
      microfrontends: PERMISSION_SNAPSHOT_FIXTURE.microfrontends.filter((item) => item.route === '/dashboard')
    };

    fetchMock.mockResolvedValue(jsonResponse(restrictedSnapshot));

    renderAppAt('/admin/acessos');

    expect(await screen.findByRole('heading', { name: 'A rota solicitada nao foi liberada para esta sessao' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Administracao de acessos/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard operacional/i })).toBeInTheDocument();
    expect(loadAuthorizedRemoteMock).not.toHaveBeenCalled();
  });

  it('shows temporary unavailability feedback when the BFF cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderAppAt('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Servico temporariamente indisponivel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});