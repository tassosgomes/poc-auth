# Shared Contracts - IAM ZCorp

Pacote TypeScript com contratos canônicos da PoC IAM ZCorp.

## Conteúdo

- Schemas e tipos:
  - UserSession
  - RoleAccessConfig
  - PermissionSnapshot
  - MicrofrontendCatalogItem
  - PermissionDecision
  - BffErrorEnvelope
- Helpers:
  - extractNormalizedRoles
  - serializeSession / parseSession
  - serializePermissionSnapshot / parsePermissionSnapshot
- Seeds:
  - ROLE_ACCESS_SEED
  - MICROFRONTEND_CATALOG_SEED
- Fixtures de teste reutilizáveis

## Comandos

- npm run build
- npm test
