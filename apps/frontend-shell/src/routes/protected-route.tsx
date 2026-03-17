import { Outlet, useLocation } from 'react-router-dom';

import { AppFrame } from '../components/app-frame';
import { BootstrapFeedback } from '../components/bootstrap-feedback';
import { FeedbackPanel } from '../components/feedback-panel';
import { describeRoute, isAuthorizedRoute } from '../catalog';
import { useSession } from '../session';

export function ProtectedRoute(): JSX.Element {
  const location = useLocation();
  const { firstAuthorizedRoute, retryBootstrap, sessionState } = useSession();

  if (sessionState.status !== 'ready') {
    return <BootstrapFeedback retryBootstrap={retryBootstrap} sessionState={sessionState} />;
  }

  if (!isAuthorizedRoute(location.pathname, sessionState.snapshot.routes)) {
    const fallbackRoute = firstAuthorizedRoute;
    const routeInfo = describeRoute(location.pathname);

    return (
      <AppFrame>
        <FeedbackPanel
          eyebrow="Acesso negado"
          title="A rota solicitada nao foi liberada para esta sessao"
          message={`O BFF nao retornou ${routeInfo.route} no snapshot de permissoes vigente.`}
          tone="danger"
          linkAction={
            fallbackRoute
              ? {
                  href: fallbackRoute,
                  label: 'Ir para uma rota autorizada'
                }
              : {
                  href: '/',
                  label: 'Voltar ao login'
                }
          }
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <Outlet />
    </AppFrame>
  );
}