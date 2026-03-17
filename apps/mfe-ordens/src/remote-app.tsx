import type { PermissionSnapshot } from '@zcorp/shared-contracts';

const ORDERS = [
  { id: 'OS-1042', status: 'Em campo', team: 'Equipe Norte', priority: 'Alta' },
  { id: 'OS-1055', status: 'Aguardando aprovacao', team: 'Equipe Centro', priority: 'Media' },
  { id: 'OS-1063', status: 'Concluida', team: 'Equipe Sul', priority: 'Baixa' }
];

export function OrdensRemoteApp({ snapshot }: { snapshot: PermissionSnapshot }): JSX.Element {
  return (
    <div className="orders-app">
      <header className="orders-hero">
        <p className="orders-hero__eyebrow">mfe-ordens</p>
        <h2>Fila operacional de ordens</h2>
        <p>Este remoto so existe para sessoes com permissao `ordens:view` no snapshot retornado pelo BFF.</p>
      </header>

      <section className="orders-banner">
        <strong>{snapshot.userId}</strong>
        <span>{snapshot.roles.join(' + ')}</span>
      </section>

      <section className="orders-grid">
        {ORDERS.map((order) => (
          <article key={order.id} className="orders-card">
            <p>{order.id}</p>
            <h3>{order.status}</h3>
            <dl>
              <div>
                <dt>Equipe</dt>
                <dd>{order.team}</dd>
              </div>
              <div>
                <dt>Prioridade</dt>
                <dd>{order.priority}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </div>
  );
}