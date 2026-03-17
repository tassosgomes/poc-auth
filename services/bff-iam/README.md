# BFF IAM

Servico Fastify responsavel pelo nucleo de autenticacao da PoC IAM ZCorp.

## Escopo atual

- `GET /api/auth/login` com Authorization Code Flow + PKCE.
- `GET /api/auth/callback` com validacao de `state` e `nonce`.
- Sessao stateful em Redis com cookie opaco `HttpOnly`, `Secure`, `SameSite=Strict` e `Path=/`.
- `GET /api/permissions` com snapshot inicial derivado do seed compartilhado.
- Proxy autenticado para `GET|POST|PUT|PATCH|DELETE /api/java/*` e `/api/dotnet/*`.

## Scripts

- `npm run build`
- `npm test`
- `npm run dev`

## Variaveis principais

Ver `.env.example` e `docs/iam-zcorp/environment-baseline.md` para a baseline completa.