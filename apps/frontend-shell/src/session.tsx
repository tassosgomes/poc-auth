import type { PermissionSnapshot } from '@zcorp/shared-contracts';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { BffClientError, getPermissionSnapshot } from './api';
import { getFirstAuthorizedRoute } from './catalog';

export type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: PermissionSnapshot }
  | { status: 'expired'; error: BffClientError }
  | { status: 'forbidden'; error: BffClientError }
  | { status: 'unavailable'; error: BffClientError };

interface SessionContextValue {
  sessionState: SessionState;
  retryBootstrap: () => void;
  firstAuthorizedRoute: string | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function mapBootstrapFailure(error: unknown): SessionState {
  if (error instanceof BffClientError) {
    if (error.status === 401) {
      return { status: 'expired', error };
    }

    if (error.status === 403) {
      return { status: 'forbidden', error };
    }

    return { status: 'unavailable', error };
  }

  return {
    status: 'unavailable',
    error: new BffClientError('Falha inesperada ao carregar a sessao.', 500, 'UPSTREAM_ERROR', undefined, {
      cause: error
    })
  };
}

async function loadSession(update: (nextState: SessionState) => void): Promise<void> {
  update({ status: 'loading' });

  try {
    const snapshot = await getPermissionSnapshot();
    update({ status: 'ready', snapshot });
  } catch (error) {
    update(mapBootstrapFailure(error));
  }
}

export function SessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const [sessionState, setSessionState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    void loadSession((nextState) => {
      if (isMounted) {
        setSessionState(nextState);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const firstAuthorizedRoute = sessionState.status === 'ready' ? getFirstAuthorizedRoute(sessionState.snapshot) : null;

  return (
    <SessionContext.Provider
      value={{
        sessionState,
        retryBootstrap: () => {
          void loadSession(setSessionState);
        },
        firstAuthorizedRoute
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
}