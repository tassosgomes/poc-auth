# BFF IAM

Servico Fastify responsavel pelo nucleo de autenticacao da PoC IAM ZCorp.

## Escopo atual

- `GET /api/auth/login` com Authorization Code Flow + PKCE.
- `GET /api/auth/callback` com validacao de `state` e `nonce`.
- Sessao stateful em Redis com cookie opaco `HttpOnly`, `Secure`, `SameSite=Strict` e `Path=/`.
- `POST /api/logout` para invalidacao idempotente da sessao corrente e limpeza do cookie.
- `POST /api/logout/global` para invalidacao imediata de todas as sessoes do usuario via `user_sessions:<userId>`.
- `GET /api/permissions` com snapshot derivado de `role_access` no banco e cache versionado no Redis.
- `GET /api/admin/role-access` protegido por `role-access:manage`.
- `PUT /api/admin/role-access/:role` com auditoria, incremento de versao e invalidacao deterministica por versao.
- Proxy autenticado para `GET|POST|PUT|PATCH|DELETE /api/java/*` e `/api/dotnet/*`.
- `GET /metrics` com metricas operacionais minimas da PoC em formato Prometheus.

## Hardening de sessao e observabilidade

- Refresh protegido por `lock:refresh:<sessionId>`, double-check da sessao apos adquirir o lock e compare-and-swap por `version` durante a gravacao.
- Falha definitiva de refresh invalida a sessao e responde `401 TOKEN_REFRESH_FAILED` com limpeza do cookie.
- Envelopes de erro do BFF incluem `correlationId`, `traceId`, `code`, `status` e `timestamp`.
- O BFF propaga `x-correlation-id` do shell para Java e .NET, ou gera um novo valor quando ausente.
- Metricas expostas:
	- `iam_token_refresh_total`
	- `iam_token_refresh_conflicts_total`
	- `iam_session_active_total`
	- `iam_permission_resolution_duration_ms`

## Persistencia de autorizacao

- Migrations SQL aplicadas automaticamente na inicializacao do servico.
- `role_access` e a fonte de verdade relacional.
- `role_access_audit` registra valor anterior/novo, `changed_by` e `correlation_id`.
- Redis mantem apenas caches derivados `permission_snapshot:<userId>:<sessionVersion>` e `role_access_cache:<role>:<version>`.

## Scripts

- `npm run build`
- `npm test`
- `npm run dev`

## Variaveis principais

Ver `.env.example` e `docs/iam-zcorp/environment-baseline.md` para a baseline completa.