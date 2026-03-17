import { Navigate, Route, Routes } from 'react-router-dom';

import { useEffect, useRef, useState } from 'react';

import { getBffBaseUrl, getLoginUrl } from './api';
import { buildNavigation, describeRoute } from './catalog';
import { BootstrapFeedback } from './components/bootstrap-feedback';
import { FeedbackPanel } from './components/feedback-panel';
import { loadAuthorizedRemote, UnauthorizedRemoteError } from './remote-loader';
import { ProtectedRoute } from './routes/protected-route';
import { useSession } from './session';

function LandingPage(): JSX.Element {
  const { firstAuthorizedRoute, retryBootstrap, sessionState } = useSession();

  if (sessionState.status === 'ready' && firstAuthorizedRoute) {
    return <Navigate replace to={firstAuthorizedRoute} />;
  }

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <p className="landing-hero__eyebrow">IAM ZCorp PoC</p>
        <h1>Shell React com sessao bootstrapada pelo BFF</h1>
        <p>
          O navegador trabalha apenas com cookie de sessao. Menus, rotas e modulos sao liberados a partir do snapshot de
          permissoes retornado por <strong>GET /api/permissions</strong>.
        </p>
        <div className="landing-hero__actions">
          <a className="button button--primary" href={getLoginUrl()}>
            Entrar com CyberArk
          </a>
          <button className="button button--secondary" type="button" onClick={retryBootstrap}>
            Revalidar sessao atual
          </button>
        </div>
      </section>

      <section className="landing-grid" aria-label="Estados de sessao">
        <article className="info-card">
          <h2>Bootstrap protegido</h2>
          <p>O shell diferencia sessao expirada, acesso negado e indisponibilidade temporaria antes de montar a UI.</p>
        </article>
        <article className="info-card">
          <h2>Navegacao derivada</h2>
          <p>Sem menus hardcoded de autorizacao: a lista de rotas vem integralmente do BFF.</p>
        </article>
        <article className="info-card">
          <h2>MFEs autorizados</h2>
          <p>Os remotes so sao registrados e carregados quando a rota consta no catalogo autorizado retornado pelo BFF.</p>
        </article>
      </section>

      {sessionState.status !== 'ready' ? (
        <div className="landing-status">
          <BootstrapFeedback retryBootstrap={retryBootstrap} sessionState={sessionState} />
        </div>
      ) : null}
    </div>
  );
}

function RemotePage({ route }: { route: string }): JSX.Element {
  const { sessionState } = useSession();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<Error | null>(null);
  const routeInfo = describeRoute(route);
  const isReady = sessionState.status === 'ready';
  const snapshot = isReady ? sessionState.snapshot : null;
  const navigation = snapshot ? buildNavigation(snapshot) : [];

  useEffect(() => {
    if (!isReady || !snapshot) {
      setStatus('loading');
      setError(null);
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | void;

    setStatus('loading');
    setError(null);

    void loadAuthorizedRemote(snapshot, route)
      .then(async (remoteModule) => {
        if (disposed || !containerRef.current) {
          return;
        }

        cleanup = await remoteModule.mount(containerRef.current, {
          snapshot,
          route,
          bffBaseUrl: getBffBaseUrl()
        });

        if (!disposed) {
          setStatus('ready');
        }
      })
      .catch((nextError: Error) => {
        if (!disposed) {
          setError(nextError);
          setStatus('error');
        }
      });

    return () => {
      disposed = true;
      if (typeof cleanup === 'function') {
        cleanup();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [isReady, route, snapshot]);

  if (!isReady || !snapshot) {
    return <></>;
  }

  if (status === 'error') {
    const isUnauthorizedRemote = error instanceof UnauthorizedRemoteError;

    return (
      <FeedbackPanel
        eyebrow={isUnauthorizedRemote ? 'Remoto bloqueado' : 'Falha ao carregar remoto'}
        title={isUnauthorizedRemote ? 'A rota nao possui remoto autorizado para esta sessao' : 'Nao foi possivel montar o microfrontend'}
        message={
          isUnauthorizedRemote
            ? `O shell recusou qualquer import dinamico para ${routeInfo.route} porque o catalogo autorizado nao contem este remoto.`
            : 'O catalogo foi validado, mas a carga do remoto falhou. Revise a publicacao do remote entry e a disponibilidade do host.'
        }
        tone={isUnauthorizedRemote ? 'danger' : 'warning'}
        linkAction={{
          href: snapshot.routes[0] ?? '/',
          label: 'Voltar para uma rota autorizada'
        }}
      />
    );
  }

  return (
    <section className="page-grid">
      <article className="page-card page-card--hero">
        <p className="page-card__eyebrow">Remote route</p>
        <h1>{routeInfo.title}</h1>
        <p>{routeInfo.summary} O carregamento acontece somente apos validar o catalogo autorizado do BFF.</p>
        <dl className="metric-grid">
          <div>
            <dt>Roles</dt>
            <dd>{sessionState.snapshot.roles.length}</dd>
          </div>
          <div>
            <dt>Permissoes</dt>
            <dd>{sessionState.snapshot.permissions.length}</dd>
          </div>
          <div>
            <dt>Rotas</dt>
            <dd>{sessionState.snapshot.routes.length}</dd>
          </div>
          <div>
            <dt>MFEs</dt>
            <dd>{sessionState.snapshot.microfrontends.length}</dd>
          </div>
        </dl>
      </article>

      <article className="page-card">
        <h2>Rotas liberadas</h2>
        <div className="module-grid">
          {navigation.map((item) => (
            <article className="module-card" key={item.route}>
              <p className="module-card__eyebrow">{item.route === route ? 'rota atual' : 'autorizada'}</p>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </article>

      <article className="page-card page-card--wide">
        <h2>Microfrontend carregado</h2>
        {status === 'loading' ? <p>Validando catalogo e carregando o remote entry autorizado...</p> : null}
        <div className="remote-slot" data-testid={`remote-slot:${route}`} ref={containerRef} />
      </article>
    </section>
  );
}

function NotFoundPage(): JSX.Element {
  return (
    <FeedbackPanel
      eyebrow="Rota inexistente"
      title="Pagina nao encontrada"
      message="A rota informada nao corresponde a nenhuma tela conhecida pelo shell."
      tone="warning"
      linkAction={{
        href: '/',
        label: 'Voltar ao inicio'
      }}
    />
  );
}

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<RemotePage route="/dashboard" />} />
        <Route path="/ordens" element={<RemotePage route="/ordens" />} />
        <Route path="/relatorios" element={<RemotePage route="/relatorios" />} />
        <Route path="/admin/acessos" element={<RemotePage route="/admin/acessos" />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}