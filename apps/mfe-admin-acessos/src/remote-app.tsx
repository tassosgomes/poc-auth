import {
  BffErrorEnvelopeSchema,
  FIXED_ROLES,
  MICROFRONTEND_CATALOG_SEED,
  ROLE_ACCESS_SEED,
  RoleAccessConfigListSchema,
  RoleAccessConfigSchema,
  RoleAccessMutationSchema,
  type FixedRole,
  type RoleAccessConfig,
  type RoleAccessMutation
} from '@zcorp/shared-contracts';
import { startTransition, useEffect, useState } from 'react';

const SCREEN_OPTIONS = ['dashboard', 'ordens', 'relatorios', 'admin-acessos'] as const;
const ROUTE_OPTIONS = MICROFRONTEND_CATALOG_SEED.map((item) => item.route);
const MFE_OPTIONS = MICROFRONTEND_CATALOG_SEED.map((item) => item.id);
const PERMISSION_OPTIONS = Array.from(
  new Set([
    ...ROLE_ACCESS_SEED.flatMap((entry) => entry.permissions),
    ...MICROFRONTEND_CATALOG_SEED.flatMap((item) => item.requiredPermissions)
  ])
).sort();

function createDraft(config: RoleAccessConfig): RoleAccessMutation {
  return {
    permissions: [...config.permissions],
    screens: [...config.screens],
    routes: [...config.routes],
    microfrontends: [...config.microfrontends]
  };
}

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

async function readJson(response: Response): Promise<unknown> {
  if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
    return null;
  }

  return response.json();
}

async function readErrorMessage(response: Response): Promise<string> {
  const payload = await readJson(response);
  const parsed = BffErrorEnvelopeSchema.safeParse(payload);
  if (parsed.success) {
    return parsed.data.message;
  }

  return `Falha HTTP ${response.status}`;
}

export function AdminAcessosRemoteApp({ bffBaseUrl }: { bffBaseUrl: string }): JSX.Element {
  const [configs, setConfigs] = useState<RoleAccessConfig[]>([]);
  const [drafts, setDrafts] = useState<Record<FixedRole, RoleAccessMutation>>({
    admin: createDraft(ROLE_ACCESS_SEED[0]),
    coordenador: createDraft(ROLE_ACCESS_SEED[1]),
    tecnico: createDraft(ROLE_ACCESS_SEED[2])
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<FixedRole | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${bffBaseUrl}/api/admin/role-access`, {
          credentials: 'include',
          headers: {
            accept: 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const nextConfigs = RoleAccessConfigListSchema.parse(await readJson(response));
        if (!active) {
          return;
        }

        startTransition(() => {
          setConfigs(nextConfigs);
          setDrafts(
            nextConfigs.reduce(
              (accumulator, config) => ({
                ...accumulator,
                [config.role]: createDraft(config)
              }),
              {} as Record<FixedRole, RoleAccessMutation>
            )
          );
          setLoading(false);
        });
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : 'Falha ao carregar matriz de acessos.');
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [bffBaseUrl]);

  function updateDraft(role: FixedRole, field: keyof RoleAccessMutation, value: string): void {
    setSavedMessage(null);
    setDrafts((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [field]: toggleValue(current[role][field], value)
      }
    }));
  }

  async function saveRole(role: FixedRole): Promise<void> {
    const payload = RoleAccessMutationSchema.parse(drafts[role]);
    setSavingRole(role);
    setError(null);
    setSavedMessage(null);

    try {
      const response = await fetch(`${bffBaseUrl}/api/admin/role-access/${role}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const parsed = RoleAccessConfigSchema.parse(await readJson(response));

      setConfigs((current) => current.map((entry) => (entry.role === role ? parsed : entry)));
      setDrafts((current) => ({
        ...current,
        [role]: createDraft(parsed)
      }));
      setSavedMessage(`Role ${role} atualizada. Novas permissoes aparecem em uma nova consulta de bootstrap.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Falha ao persistir alteracoes da role.');
    } finally {
      setSavingRole(null);
    }
  }

  return (
    <div className="admin-app">
      <header className="admin-hero">
        <div>
          <p className="admin-hero__eyebrow">mfe-admin-acessos</p>
          <h2>Matriz dinamica de acesso por role</h2>
        </div>
        <p>Este remoto consome diretamente `GET` e `PUT /api/admin/role-access/:role` usando o cookie de sessao do BFF.</p>
      </header>

      {loading ? <p className="admin-status">Carregando configuracao de acessos...</p> : null}
      {error ? <p className="admin-status admin-status--error">{error}</p> : null}
      {savedMessage ? <p className="admin-status admin-status--success">{savedMessage}</p> : null}

      <section className="admin-grid">
        {FIXED_ROLES.map((role) => {
          const draft = drafts[role];
          const persisted = configs.find((entry) => entry.role === role);

          return (
            <article key={role} className="admin-card">
              <header className="admin-card__header">
                <div>
                  <p>{role}</p>
                  <h3>Configurar acessos</h3>
                </div>
                <span>versao {persisted?.version ?? 0}</span>
              </header>

              <fieldset>
                <legend>Permissoes</legend>
                {PERMISSION_OPTIONS.map((permission) => (
                  <label key={permission}>
                    <input
                      checked={draft.permissions.includes(permission)}
                      onChange={() => updateDraft(role, 'permissions', permission)}
                      type="checkbox"
                    />
                    <span>{permission}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset>
                <legend>Screens</legend>
                {SCREEN_OPTIONS.map((screen) => (
                  <label key={screen}>
                    <input checked={draft.screens.includes(screen)} onChange={() => updateDraft(role, 'screens', screen)} type="checkbox" />
                    <span>{screen}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset>
                <legend>Rotas</legend>
                {ROUTE_OPTIONS.map((route) => (
                  <label key={route}>
                    <input checked={draft.routes.includes(route)} onChange={() => updateDraft(role, 'routes', route)} type="checkbox" />
                    <span>{route}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset>
                <legend>Microfrontends</legend>
                {MFE_OPTIONS.map((microfrontend) => (
                  <label key={microfrontend}>
                    <input
                      checked={draft.microfrontends.includes(microfrontend)}
                      onChange={() => updateDraft(role, 'microfrontends', microfrontend)}
                      type="checkbox"
                    />
                    <span>{microfrontend}</span>
                  </label>
                ))}
              </fieldset>

              <button disabled={savingRole === role} onClick={() => void saveRole(role)} type="button">
                {savingRole === role ? 'Salvando...' : 'Persistir role'}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}