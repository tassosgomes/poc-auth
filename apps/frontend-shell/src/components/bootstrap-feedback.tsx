import { useEffect } from 'react';

import { getLoginUrl, redirectToLogin } from '../api';
import type { SessionState } from '../session';
import { FeedbackPanel } from './feedback-panel';

interface BootstrapFeedbackProps {
  sessionState: SessionState;
  retryBootstrap: () => void;
}

export function BootstrapFeedback({ sessionState, retryBootstrap }: BootstrapFeedbackProps): JSX.Element | null {
  if (sessionState.status === 'loading') {
    return (
      <FeedbackPanel
        eyebrow="Bootstrap de sessao"
        title="Carregando autorizacoes"
        message="O shell esta consultando o BFF para montar a navegacao protegida da sessao atual."
      />
    );
  }

  if (sessionState.status === 'expired') {
    return <ExpiredBootstrapFeedback traceId={sessionState.error.envelope?.traceId} />;
  }

  if (sessionState.status === 'forbidden') {
    return (
      <FeedbackPanel
        eyebrow="Acesso negado"
        title="O BFF recusou o bootstrap desta sessao"
        message="As roles efetivas nao concedem acesso ao shell solicitado."
        tone="danger"
        traceId={sessionState.error.envelope?.traceId}
        linkAction={{
          href: getLoginUrl(),
          label: 'Autenticar novamente'
        }}
      />
    );
  }

  if (sessionState.status === 'unavailable') {
    return (
      <FeedbackPanel
        eyebrow="Indisponibilidade temporaria"
        title="Servico temporariamente indisponivel"
        message="O shell nao conseguiu obter o snapshot de permissoes. Tente novamente em instantes."
        tone="warning"
        traceId={sessionState.error.envelope?.traceId}
        buttonAction={{
          label: 'Tentar novamente',
          onClick: retryBootstrap
        }}
      />
    );
  }

  return null;
}

function ExpiredBootstrapFeedback({ traceId }: { traceId?: string }): JSX.Element {
  useEffect(() => {
    redirectToLogin();
  }, []);

  return (
    <FeedbackPanel
      eyebrow="Sessao expirada"
      title="Sua sessao nao esta mais valida"
      message="A autenticacao expirou ou nao foi localizada. O shell esta redirecionando para um novo login."
      tone="warning"
      traceId={traceId}
      details={<p className="feedback-panel__hint">Se o redirecionamento nao acontecer, use a acao abaixo para iniciar a autenticacao novamente.</p>}
      linkAction={{
        href: getLoginUrl(),
        label: 'Iniciar novo login'
      }}
    />
  );
}