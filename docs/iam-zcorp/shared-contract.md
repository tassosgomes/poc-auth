# Contrato Compartilhado IAM ZCorp v1.0

## Objetivo

Este documento define os contratos canônicos compartilhados entre Shell, BFF, serviço Java e serviço .NET para sessão, autorização e catálogo de microfrontends.

## Modelos Canônicos

- UserSession
- RoleAccessConfig
- PermissionSnapshot
- MicrofrontendCatalogItem
- PermissionDecision
- BffErrorEnvelope

Implementação de referência: contracts/shared.

## Claim de Roles e Normalização

- Claim de origem do IdP: ROLES (array de strings).
- Semântica obrigatória da PoC: roles fixas em minúsculo.
- Conjunto fixo aceito: admin, coordenador, tecnico.
- Regras de leitura:
  - BFF lê claims.ROLES e fallback claims.roles.
  - Valores são normalizados para minúsculo.
  - Valores desconhecidos são ignorados e devem ser logados.

### Mapeamento por Runtime

- BFF Node/Fastify:
  - Entrada: ROLES
  - Normalização: toLowerCase + filtro por role fixa
- Java/Spring Security:
  - Entrada: claim ROLES
  - Conversão para authorities interna em minúsculo sem prefixo no token
- .NET/ASP.NET Core:
  - Entrada: claim ROLES
  - Conversão para claims internas mantendo minúsculo

## Exceção Arquitetural

A convenção global de roles em SCREAMING_SNAKE_CASE não se aplica nesta PoC por imposição de contrato de negócio no PRD.

- Exceção explícita: roles em minúsculo (admin, coordenador, tecnico).
- Justificativa: interoperabilidade e consistência entre IdP, BFF, Java e .NET.
- Governança: mudanças no conjunto de roles exigem atualização de PRD, TechSpec, seed e contratos versionados.

## Semântica de Autorização Efetiva

- Modelo: allow-list.
- Composição: união de permissões das roles válidas do usuário.
- Falha segura:
  - sem role válida: negação total (FORBIDDEN)
  - permissão não explicitamente concedida: negada

## Códigos de Erro Obrigatórios do BFF

- OIDC_CALLBACK_INVALID
- SESSION_NOT_FOUND
- SESSION_EXPIRED
- TOKEN_REFRESH_FAILED
- FORBIDDEN
- SESSION_STORE_UNAVAILABLE
- UPSTREAM_ERROR

## Envelope de Erro do BFF

Campos canônicos:

- `code`
- `message`
- `status`
- `timestamp`
- `correlationId` opcional, mas obrigatório sempre que houver request HTTP processado
- `traceId` opcional para alinhamento com telemetria e compatibilidade de UI
- `details` opcional para metadados operacionais sem tokens ou cookies

Regras:

- O BFF deve ecoar `x-correlation-id` no header de resposta e no campo `correlationId` quando o header estiver presente.
- Na ausencia do header, o BFF gera um `correlationId` e o reutiliza no envelope, logs e chamadas upstream.
- Java e .NET devem continuar expondo `correlationId` em `ProblemDetails` para preservar rastreabilidade ponta a ponta.

## Catálogo Inicial de MFEs

Cada item obrigatório contém:

- id
- route
- entry
- scope
- module
- requiredPermissions

Catálogo inicial:

- dashboard
- ordens
- relatorios
- admin-acessos

## Seed Inicial de Acessos por Role

- admin: dashboard, ordens, criacao de ordens, relatorios, admin-acessos
- coordenador: dashboard, ordens, criacao de ordens, relatorios
- tecnico: dashboard, ordens, relatorios

Permissoes de ordens previstas no contrato atual:

- `ordens:view`
- `ordens:create`
