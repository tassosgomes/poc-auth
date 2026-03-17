import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

import { buildNavigation } from '../catalog';
import { useSession } from '../session';

export function AppFrame({ children }: { children: ReactNode }): JSX.Element {
  const { sessionState } = useSession();

  if (sessionState.status !== 'ready') {
    throw new Error('AppFrame requires an authenticated session');
  }

  const navigation = buildNavigation(sessionState.snapshot);

  return (
    <div className="shell-layout">
      <aside className="shell-sidebar">
        <div className="shell-sidebar__brand">
          <p className="shell-sidebar__eyebrow">ZCorp IAM</p>
          <h1>Shell protegido</h1>
          <p>Menus, rotas e modulos refletem estritamente o snapshot devolvido pelo BFF.</p>
        </div>

        <nav aria-label="Navegacao principal" className="shell-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.route}
              className={({ isActive }) => (isActive ? 'shell-nav__link shell-nav__link--active' : 'shell-nav__link')}
              to={item.route}
            >
              <span>{item.title}</span>
              <small>{item.summary}</small>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="shell-main">
        <header className="shell-header">
          <div>
            <p className="shell-header__eyebrow">Sessao autenticada</p>
            <h2>{sessionState.snapshot.userId}</h2>
          </div>
          <div className="role-list" aria-label="Roles efetivas">
            {sessionState.snapshot.roles.map((role) => (
              <span className="role-pill" key={role}>
                {role}
              </span>
            ))}
          </div>
        </header>

        <main className="shell-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}