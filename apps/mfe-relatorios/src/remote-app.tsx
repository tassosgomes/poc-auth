import type { PermissionSnapshot } from '@zcorp/shared-contracts';

const REPORTS = [
  { title: 'Produtividade semanal', detail: 'Comparativo de ordens concluídas por equipe', accent: 'Verde operacional' },
  { title: 'Pendencias por regional', detail: 'SLA, backlog e replanejamento imediato', accent: 'Ocre analitico' },
  { title: 'Auditoria de acesso', detail: 'Ultimas alteracoes e impacto nas permissoes efetivas', accent: 'Azul profundo' }
];

export function RelatoriosRemoteApp({ snapshot }: { snapshot: PermissionSnapshot }): JSX.Element {
  return (
    <div className="reports-app">
      <header className="reports-hero">
        <div>
          <p className="reports-hero__eyebrow">mfe-relatorios</p>
          <h2>Centro analitico protegido</h2>
        </div>
        <p>
          O shell so requisita este remoto quando `relatorios:view` consta no snapshot da sessao de {snapshot.userId}.
        </p>
      </header>

      <section className="reports-grid">
        {REPORTS.map((report) => (
          <article key={report.title} className="reports-card">
            <p>{report.accent}</p>
            <h3>{report.title}</h3>
            <span>{report.detail}</span>
          </article>
        ))}
      </section>

      <section className="reports-footer">
        <strong>Permissoes efetivas</strong>
        <ul>
          {snapshot.permissions.map((permission) => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}