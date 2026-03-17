# BFF IAM

Servico Fastify responsavel pelo nucleo de autenticacao da PoC IAM ZCorp.

## Escopo atual

- `GET /api/auth/login` com Authorization Code Flow + PKCE.
- `GET /api/auth/callback` com validacao de `state` e `nonce`.
- Sessao stateful em Redis com cookie opaco `HttpOnly`, `Secure`, `SameSite=Strict` e `Path=/`.
- `GET /api/permissions` com snapshot derivado de `role_access` no banco e cache versionado no Redis.
- `GET /api/admin/role-access` protegido por `role-access:manage`.
- `PUT /api/admin/role-access/:role` com auditoria, incremento de versao e invalidacao deterministica por versao.
- Proxy autenticado para `GET|POST|PUT|PATCH|DELETE /api/java/*` e `/api/dotnet/*`.

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