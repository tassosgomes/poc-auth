import type { PermissionSnapshot } from '@zcorp/shared-contracts';

export function DashboardRemoteApp({ snapshot }: { snapshot: PermissionSnapshot }): JSX.Element {
  return (
    <div className="remote-app">
      <header className="remote-app__hero">
        <p className="remote-app__eyebrow">mfe-dashboard</p>
        <h2>Panorama operacional da sessao</h2>
        <p>Este remoto reflete roles, permissoes e modulos autorizados sem depender de menus hardcoded no shell.</p>
      </header>

      <section className="remote-stats" aria-label="Metricas da sessao">
        <article>
          <span>Roles</span>
          <strong>{snapshot.roles.length}</strong>
        </article>
        <article>
          <span>Permissoes</span>
          <strong>{snapshot.permissions.length}</strong>
        </article>
        <article>
          <span>Rotas</span>
          <strong>{snapshot.routes.length}</strong>
        </article>
        <article>
          <span>MFEs</span>
          <strong>{snapshot.microfrontends.length}</strong>
        </article>
      </section>

      <section className="remote-grid">
        <article className="remote-card">
          <h3>Roles efetivas</h3>
          <ul className="remote-chip-list">
            {snapshot.roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </article>

        <article className="remote-card">
          <h3>Permissoes liberadas</h3>
          <ul className="remote-list">
            {snapshot.permissions.map((permission) => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        </article>

        <article className="remote-card remote-card--wide">
          <h3>Catalogo autorizado</h3>
          <div className="remote-catalog">
            {snapshot.microfrontends.map((item) => (
              <article key={item.id} className="remote-catalog__item">
                <p>{item.id}</p>
                <strong>{item.route}</strong>
                <span>{item.scope}</span>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}