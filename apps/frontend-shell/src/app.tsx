import { Navigate, Route, Routes } from 'react-router-dom';

import { getLoginUrl } from './api';
import { buildNavigation, describeRoute, findMicrofrontend } from './catalog';
import { BootstrapFeedback } from './components/bootstrap-feedback';
import { FeedbackPanel } from './components/feedback-panel';
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
          <p>Os placeholders ja preservam o catalogo filtrado para acoplamento com Module Federation na tarefa 5.0.</p>
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

function DashboardPage(): JSX.Element {
  const { sessionState } = useSession();

  if (sessionState.status !== 'ready') {
    return <></>;
  }

  const navigation = buildNavigation(sessionState.snapshot);

  return (
    <section className="page-grid">
      <article className="page-card page-card--hero">
        <p className="page-card__eyebrow">Snapshot de permissoes</p>
        <h1>Dashboard dinamico</h1>
        <p>
          Este painel resume as roles efetivas, as permissoes liberadas e os microfrontends autorizados para a sessao
          atual.
        </p>
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
        <h2>Roles efetivas</h2>
        <ul className="chip-list">
          {sessionState.snapshot.roles.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
      </article>

      <article className="page-card">
        <h2>Permissoes concedidas</h2>
        <ul className="list-block">
          {sessionState.snapshot.permissions.map((permission) => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
      </article>

      <article className="page-card page-card--wide">
        <h2>Modulos autorizados</h2>
        <div className="module-grid">
          {navigation.map((item) => {
            const remote = findMicrofrontend(sessionState.snapshot, item.route);
            return (
              <article className="module-card" key={item.route}>
                <p className="module-card__eyebrow">{remote?.id ?? 'core-shell'}</p>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <dl>
                  <div>
                    <dt>Rota</dt>
                    <dd>{item.route}</dd>
                  </div>
                  <div>
                    <dt>Modulo</dt>
                    <dd>{remote?.module ?? 'interno'}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}

function FeaturePage({ route }: { route: string }): JSX.Element {
  const { sessionState } = useSession();

  if (sessionState.status !== 'ready') {
    return <></>;
  }

  const routeInfo = describeRoute(route);
  const microfrontend = findMicrofrontend(sessionState.snapshot, route);

  return (
    <section className="page-grid">
      <article className="page-card page-card--hero">
        <p className="page-card__eyebrow">Rota protegida</p>
        <h1>{routeInfo.title}</h1>
        <p>{routeInfo.summary}</p>
      </article>

      <article className="page-card">
        <h2>Catalogo autorizado</h2>
        {microfrontend ? (
          <dl className="detail-list">
            <div>
              <dt>ID</dt>
              <dd>{microfrontend.id}</dd>
            </div>
            <div>
              <dt>Entrada remota</dt>
              <dd>{microfrontend.entry}</dd>
            </div>
            <div>
              <dt>Scope</dt>
              <dd>{microfrontend.scope}</dd>
            </div>
            <div>
              <dt>Modulo</dt>
              <dd>{microfrontend.module}</dd>
            </div>
          </dl>
        ) : (
          <p>Esta rota e servida pelo proprio shell e nao depende de remote entry externo.</p>
        )}
      </article>

      <article className="page-card">
        <h2>Permissoes requeridas</h2>
        <ul className="list-block">
          {(microfrontend?.requiredPermissions ?? []).map((permission) => (
            <li key={permission}>{permission}</li>
          ))}
          {(microfrontend?.requiredPermissions ?? []).length === 0 ? <li>Nenhuma permissao adicional.</li> : null}
        </ul>
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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ordens" element={<FeaturePage route="/ordens" />} />
        <Route path="/relatorios" element={<FeaturePage route="/relatorios" />} />
        <Route path="/admin/acessos" element={<FeaturePage route="/admin/acessos" />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}