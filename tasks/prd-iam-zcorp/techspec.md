# Especificacao Tecnica: IAM ZCorp PoC

## Resumo Executivo

Esta especificacao define a implementacao da PoC de IAM com padrao BFF para eliminar exposicao de tokens no navegador e manter consistencia de autenticacao/autorizacao entre React, Node.js/Fastify, Spring Boot e ASP.NET Core. A arquitetura adota sessao stateful no BFF, Redis como camada operacional de sessao e cache, e persistencia relacional como fonte de verdade para a matriz dinamica de acessos por role. Essa decisao evita uma arquitetura precaria em que Redis acumularia responsabilidades de cache e configuracao duravel sem garantias adequadas de recuperacao, auditoria e versionamento.

A implementacao sera organizada em seis componentes: shell React, microfrontends remotos via Module Federation, BFF Fastify, servico Java, servico .NET, Redis e banco relacional do BFF. O BFF concentrara OIDC, troca e renovacao de tokens, resolucao de permissoes, filtragem de catalogo de microfrontends e proxy autenticado. Os microservicos permanecem autonomos para validacao JWT e autorizacao por permissao efetiva. O desenho privilegia contratos explicitos, invalidacao deterministica de cache, observabilidade com correlacao fim a fim e testes de integracao/contrato como eixo principal de confianca. Para desenvolvimento local aderente ao requisito de cookie `Secure`, o `docker-compose` deve incluir `Traefik` como reverse proxy TLS na borda, usando hostnames sob o dominio controlado `tasso.dev.br`.

## Arquitetura do Sistema

### Visao Geral dos Componentes

- `frontend-shell`: aplicacao React responsavel por bootstrap de sessao, roteamento, navegacao e carregamento condicional de microfrontends. Nao armazena tokens; trabalha apenas com cookie de sessao e catalogo autorizado retornado pelo BFF.
- `mfe-dashboard`, `mfe-ordens`, `mfe-relatorios`, `mfe-admin-acessos`: remotes via Module Federation. Cada remoto expoe bootstrap e rotas internas, mas so pode ser requisitado se constar no catalogo autorizado.
- `bff-iam`: servico Fastify + TypeScript. Responsavel por login OIDC com PKCE, callback, sessao stateful, refresh controlado com lock por sessao, `GET /api/permissions`, administracao da matriz de acesso, logout local/global e proxy autenticado para microservicos.
- `edge-traefik`: reverse proxy do ambiente local e compose. Responsavel por terminação TLS, roteamento por host, renovacao ACME e cabecalhos encaminhados para o BFF e shell.
- `authz-store`: Redis 7 usado para `session:<sessionId>`, indice reverso `user_sessions:<userId>`, cache de permissoes efetivas e locks de refresh.
- `authz-db`: banco relacional do BFF para persistir `role_access`, auditoria basica e seed inicial. Redis e camada derivada, nao fonte de verdade.
- `orders-service` (Java 21 / Spring Boot 3): API de ordens de servico com validacao JWT por JWKS, resolucao de permissoes com cache local curto e enforcement por permissao.
- `reports-service` (.NET 8): API de relatorios com validacao JWT por JWKS, leitura de permissoes efetivas e enforcement consistente com Java.

Hostnames oficiais para DNS local e roteamento do Traefik:

- `traefik-authpoc.tasso.dev.br` -> painel e health do Traefik, opcionalmente restrito a rede interna.
- `app-authpoc.tasso.dev.br` -> shell React.
- `api-authpoc.tasso.dev.br` -> BFF Fastify e callback OIDC.
- `dashboard-authpoc.tasso.dev.br` -> remoto `mfe-dashboard`, se servido por host dedicado.
- `ordens-authpoc.tasso.dev.br` -> remoto `mfe-ordens`, se servido por host dedicado.
- `relatorios-authpoc.tasso.dev.br` -> remoto `mfe-relatorios`, se servido por host dedicado.
- `admin-authpoc.tasso.dev.br` -> remoto `mfe-admin-acessos`, se servido por host dedicado.
- `java-authpoc.tasso.dev.br` -> servico Java, preferencialmente exposto apenas ao Traefik.
- `dotnet-authpoc.tasso.dev.br` -> servico .NET, preferencialmente exposto apenas ao Traefik.

Se os MFEs forem publicados pelo proprio shell ou pelo BFF em um unico host, os nomes `dashboard-*`, `ordens-*`, `relatorios-*` e `admin-*` podem ser omitidos. O minimo aceitavel para o fluxo OIDC e de cookie e `app-authpoc.tasso.dev.br` e `api-authpoc.tasso.dev.br`.

Fluxo de dados principal:

1. Shell redireciona autenticacao para o BFF.
2. BFF executa Authorization Code Flow + PKCE contra CyberArk.
3. BFF persiste sessao no Redis, associa sessoes ao usuario e responde com cookie opaco.
4. Shell consulta `GET /api/permissions`.
5. BFF le da sessao, calcula permissoes a partir das roles, busca matriz no banco, popula/invalida cache Redis e devolve apenas rotas e MFEs autorizados.
6. Shell monta menus e carrega remotes autorizados sob demanda.
7. Requisicoes protegidas passam pelo BFF, que injeta `Authorization: Bearer` para Java ou .NET.
8. Microservicos validam JWT localmente e resolvem permissao efetiva antes de atender.

## Design de Implementacao

### Interfaces Principais

```ts
export interface SessionStore {
  get(sessionId: string): Promise<UserSession | null>;
  save(session: UserSession): Promise<void>;
  delete(sessionId: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<number>;
  withRefreshLock<T>(sessionId: string, action: () => Promise<T>): Promise<T>;
}

export interface PermissionService {
  getEffectivePermissions(input: PermissionRequest): Promise<PermissionSnapshot>;
  updateRoleAccess(role: FixedRole, command: UpdateRoleAccessCommand): Promise<RoleAccessConfig>;
}

export interface OidcClient {
  createAuthorizationUrl(input: AuthorizationRequest): Promise<string>;
  exchangeCode(input: CallbackPayload): Promise<TokenSet>;
  refresh(input: RefreshRequest): Promise<TokenSet>;
}
```

```java
public interface PermissionResolver {
    PermissionDecision resolve(Set<String> roles, String permission, String resource);
}
```

```csharp
public interface IPermissionResolver
{
    Task<PermissionDecision> ResolveAsync(
        IReadOnlyCollection<string> roles,
        string permission,
        string resource,
        CancellationToken cancellationToken);
}
```

Essas interfaces separam responsabilidades que frequentemente sao confundidas de forma amadora: sessao, OIDC e autorizacao nao devem se contaminar mutuamente. Mistura-las produziria acoplamento inutil e falhas de teste previsiveis.

### Modelos de Dados

Entidades e estruturas principais:

- `UserSession`
  - `sessionId`, `userId`, `roles`, `accessToken`, `refreshToken`, `idToken`
  - `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `absoluteExpiresAt`, `lastAccessAt`, `version`
- `RoleAccessConfig`
  - `role`, `permissions[]`, `screens[]`, `routes[]`, `microfrontends[]`, `updatedAt`, `updatedBy`, `version`
- `PermissionSnapshot`
  - `userId`, `roles[]`, `permissions[]`, `screens[]`, `routes[]`, `microfrontends[]`, `generatedAt`, `version`
- `MicrofrontendCatalogItem`
  - `id`, `route`, `entry`, `scope`, `module`, `requiredPermissions[]`
- `PermissionDecision`
  - `allowed`, `matchedRoles[]`, `matchedPermissions[]`, `reason`

Persistencia recomendada no banco relacional do BFF:

- `role_access`
  - `role` PK
  - `permissions_json`
  - `screens_json`
  - `routes_json`
  - `microfrontends_json`
  - `version`
  - `updated_at`
  - `updated_by`
- `role_access_audit`
  - `id`
  - `role`
  - `previous_value_json`
  - `new_value_json`
  - `changed_at`
  - `changed_by`
  - `correlation_id`

Chaves Redis:

- `session:<sessionId>` -> sessao completa com TTL alinhado ao refresh token e limite absoluto separado.
- `user_sessions:<userId>` -> set de `sessionId` para logout global.
- `permission_snapshot:<userId>:<sessionVersion>` -> snapshot efetivo para bootstrap rapido.
- `role_access_cache:<role>:<version>` -> cache derivado da tabela `role_access`.
- `lock:refresh:<sessionId>` -> lock curto para evitar refresh concorrente.

Observacao critica: o PRD fixa roles em minusculo (`admin`, `coordenador`, `tecnico`), enquanto a convencao global do repositrio recomenda `SCREAMING_SNAKE_CASE`. A Tech Spec preserva o PRD como contrato desta PoC. Tratar isso como se fosse irrelevante seria negligencia de interoperabilidade. O desvio deve ser explicitamente documentado em configuracoes Java e .NET de mapping de claims.

### Endpoints de API

- `GET /api/auth/login`
  - inicia OIDC; responde `302` para CyberArk.
- `GET /api/auth/callback`
  - valida `state`/`nonce`, troca codigo por tokens, cria sessao, define cookie e redireciona ao shell.
- `GET /api/permissions`
  - retorna `PermissionSnapshot` com catalogo de MFEs ja filtrado.
- `POST /api/logout`
  - invalida sessao corrente e remove cookie.
- `POST /api/logout/global`
  - invalida todas as sessoes do usuario corrente usando indice reverso.
- `GET /api/admin/role-access`
  - retorna matriz atual por role; protegido por permissao administrativa.
- `PUT /api/admin/role-access/:role`
  - atualiza configuracao, grava auditoria, incrementa `version` e invalida caches.
- `ALL /api/java/*`
  - proxy autenticado para `orders-service`.
- `ALL /api/dotnet/*`
  - proxy autenticado para `reports-service`.

Endpoints internos dos microservicos devem adotar path versionado conforme regra REST do repositrio:

- Java: `GET /orders/v1/orders`, `POST /orders/v1/orders`
- .NET: `GET /reports/v1/reports`, `GET /reports/v1/reports/{id}`

O BFF mantem contratos externos simplificados para a UI, mas nao deve mascarar erros de dominio; deve apenas normalizar autenticacao, sessao e falhas de upstream em envelope padronizado.

## Pontos de Integracao

- `CyberArk Identity`
  - OIDC Authorization Code + PKCE.
  - Integracoes: authorization endpoint, token endpoint, JWKS, optional end-session.
  - Callback oficial de desenvolvimento: `https://api-authpoc.tasso.dev.br/api/auth/callback`.
  - Falhas tratadas com erro padronizado `OIDC_CALLBACK_INVALID` ou `TOKEN_REFRESH_FAILED`.
- `Redis`
  - Sessao, locks e cache operacional.
  - Falha em operacoes de sessao gera `503 SESSION_STORE_UNAVAILABLE`.
- `Banco relacional do BFF`
  - Fonte de verdade para `role_access` e trilha minima de auditoria.
  - Falha de escrita invalida atualizacao administrativa; nao ha fallback silencioso.
- `Microservicos Java e .NET`
  - Recebem JWT pelo header `Authorization`.
  - Validam `issuer`, `audience`, assinatura, expiracao e formato de claims localmente.

Tratamento de erro e resiliencia:

- Timeout de rede configurado no BFF para CyberArk e upstreams.
- Retry apenas para leituras idempotentes do JWKS e do banco de permissoes; refresh token nao pode ser repetido sem controle estrito.
- Lock de refresh com double-check: rele sessao apos obter lock antes de renovar.
- Invalidacao de cache por versionamento, nunca por exclusao cega isolada.

Requisitos de borda local com Traefik no `docker-compose`:

- `Traefik` deve ser o unico componente publicado nas portas `80` e `443`.
- Shell, BFF e remotes devem ser roteados por labels do `docker-compose`, nunca por exposicao direta de porta ao host quando o objetivo e validar o fluxo real de cookie.
- TLS valido deve ser obtido via ACME para `*.tasso.dev.br` ou certificados equivalentes ja operacionais no ambiente local; a borda deve repassar `X-Forwarded-Proto=https` para o BFF.
- O cookie de sessao deve ser emitido com `Secure=true`, `HttpOnly=true`, `SameSite=Strict` e, por padrao, sem atributo `Domain`, mantendo-o restrito ao host do BFF.
- O shell deve consumir o BFF em `https://api-authpoc.tasso.dev.br`; se for necessario compartilhamento cross-subdomain com cookie, isso deve ser deliberado, nao inferido.

## Analise de Impacto

| Componente Afetado | Tipo de Impacto | Descricao & Nivel de Risco | Acao Requerida |
| --- | --- | --- | --- |
| BFF Fastify | Novo componente critico | Concentra autenticacao, sessao, proxy e autorizacao de UI. Risco alto por centralidade operacional. | Implementar primeiro com contratos e testes de integracao |
| React shell | Nova composicao | Passa a depender exclusivamente de `GET /api/permissions` para navegacao e carga remota. Risco medio. | Definir bootstrap, guardas de rota e loader de MFEs |
| MFEs | Novo modelo de entrega | Exposicao via Module Federation e gating por catalogo autorizado. Risco medio. | Padronizar manifesto remoto e contrato de bootstrap |
| Redis | Recurso compartilhado | Armazena sessao, locks e cache; indisponibilidade afeta login e autorizacao. Risco alto. | Configurar TTL, health check e tratamento explicito de degradacao |
| Banco do BFF | Novo armazenamento | Guarda matriz de acessos e auditoria. Risco medio. | Criar migrations/seed inicial e estrategia de invalidacao |
| Servico Java | Nova API protegida | Deve alinhar claims, JWKS e enforcement por permissao. Risco medio. | Implementar resolver compartilhando contrato de permissao |
| Servico .NET | Nova API protegida | Mesmo risco do Java, com divergencia de framework. Risco medio. | Implementar resolver com testes equivalentes ao Java |
| Traefik local | Nova borda reversa | Introduz TLS, roteamento por host e dependencia de DNS local. Risco medio. | Declarar labels no compose, armazenar ACME com seguranca e documentar DNS |
| Infra local/K8s | Nova topologia | Necessita compose, secrets, probes e manifests. Risco medio. | Publicar compose, Dockerfiles e manifests minimos |

## Abordagem de Testes

### Testes Unitarios

- BFF: validacao de callback OIDC, serializacao de sessao, fusao de permissoes por uniao, filtro de catalogo de MFEs, normalizacao de erros, algoritmo de refresh com lock.
- Shell React: guards de rota, parser de `PermissionSnapshot`, componente de bootstrap de sessao, menu dinmico e bloqueio de carga remota nao autorizada.
- Java: `PermissionResolver`, `JwtClaimsAdapter`, handlers de caso de uso e mapeamento de erros.
- .NET: `IPermissionResolver`, handlers CQRS, claims mapping e responses Problem Details quando aplicavel.

Mocks aceitaveis apenas para CyberArk e dependencias externas. Redis, banco do BFF e validacao JWT devem aparecer em testes de integracao, pois omiti-los seria uma forma rudimentar de autoengano.

### Testes de Integracao

- BFF + Redis + banco: login simulado, bootstrap de permissao, atualizacao de role access com invalidacao de cache, logout local e global.
- BFF + mock OIDC: callback invalido, token exchange, refresh token rotation e cenarios de concorrencia com duas requisicoes simultaneas.
- BFF + Java/.NET: proxy autenticado, propagacao de correlacao e padronizacao de `401/403/502`.
- Java + JWKS local: validacao de JWT e enforcement por permissao.
- .NET + JWKS local: cenarios equivalentes aos do Java para demonstrar consistencia de decisao.
- E2E: login, montagem de menu, bloqueio de MFE nao autorizado, tela administrativa e reflexo de alteracao sem redeploy.

Ferramentas sugeridas por stack:

- React: Vitest + RTL + MSW.
- Node: Vitest/Jest + Testcontainers para Redis e banco.
- Java: JUnit 5 + AssertJ + Spring Boot Test + Testcontainers.
- .NET: xUnit + AwesomeAssertions + WebApplicationFactory + Testcontainers.

## Sequenciamento de Desenvolvimento

### Ordem de Construcao

1. Definir contratos compartilhados: modelos de sessao, permissao, catalogo de MFE, erros e configuracoes por ambiente. Sem isso, o restante degenera em integracoes inconsistentes.
2. Implementar BFF base: login, callback, sessao Redis, cookie, `GET /api/permissions` e proxy minimo.
3. Implementar persistencia `role_access` no banco do BFF, seed inicial, invalidacao de cache e endpoints administrativos.
4. Implementar shell React e loader de Module Federation guiado por catalogo autorizado.
5. Implementar servico Java com validacao JWT e permissao efetiva.
6. Implementar servico .NET com validacao JWT e permissao efetiva equivalente.
7. Completar logout global, refresh concorrente, `docker-compose` com Traefik reverso, manifests K8s e suites de integracao/E2E.

### Dependencias Tecnicas

- Ambiente CyberArk de desenvolvimento com client OIDC, callback e JWKS acessivel.
- Banco relacional disponivel para o BFF.
- Redis 7 disponivel para sessao e cache.
- Definicao oficial do manifest de remotes do Module Federation.
- Registros DNS locais apontando para o host ou swarm local: no minimo `app-authpoc.tasso.dev.br` e `api-authpoc.tasso.dev.br`.
- `Traefik` configurado no `docker-compose` como reverse proxy com certificados validos para os hosts da PoC.

## Monitoramento e Observabilidade

- Todos os componentes devem emitir logs JSON com `traceId`, `spanId`, `correlationId`, `userId` quando disponivel e sem registrar tokens ou cookies.
- Frontend: OpenTelemetry apenas em producao, propagando W3C Trace Context para o BFF.
- BFF: spans para login, callback, refresh, resolucao de permissoes, proxy Java/.NET e atualizacao de `role_access`.
- Traefik: access logs JSON, metricas de entrypoint e erros TLS habilitados para diagnostico de borda.
- Java: Spring Actuator com `health`, `metrics`, `prometheus`, `liveness` e `readiness`.
- .NET: Health Checks com endpoints distintos para liveness/readiness e dependencia de Redis/JWKS.
- Metricas minimas:
  - `iam_permission_resolution_duration_ms`
  - `iam_token_refresh_total`
  - `iam_token_refresh_conflicts_total`
  - `iam_session_active_total`
  - `iam_role_access_cache_hit_ratio`
  - `iam_mfe_catalog_filtered_total`
- Dashboards devem acompanhar p95 de leitura Redis, taxa de `401`, taxa de refresh e falhas de upstream.

## Consideracoes Tecnicas

### Decisoes Principais

- BFF stateful com Redis: unico modelo coerente com a exigencia de nao expor tokens ao navegador.
- Persistencia relacional para `role_access`: Redis isolado como fonte de verdade seria tecnicamente insustentavel para configuracao administrativa versionada.
- Module Federation: atende o requisito de shell + remotes carregados sob demanda com fronteira clara entre catalogo autorizado e importacao remota.
- Traefik no `docker-compose` como borda TLS: e a unica abordagem local coerente com a exigencia de cookie `Secure` sem recorrer a excecoes artificiais.
- Autorizacao por permissao efetiva, nao por `hasRole` cru em controlador: roles fixas so definem ponto de partida; decisao final depende da matriz dinamica.
- Cache por versao: abordagem mais segura para evitar leituras obsoletas apos alteracao administrativa.

### Riscos Conhecidos

- Divergencia entre role names do PRD e padrao global do repositrio. Mitigacao: mapping explicito e ADR curta documentando a excecao da PoC.
- Dependencia de DNS local e certificados validos para `tasso.dev.br`. Mitigacao: documentar os hostnames oficiais, centralizar a borda no Traefik e validar ACME antes do teste OIDC.
- Corrupcao de sessao em refresh concorrente. Mitigacao: lock por sessao, compare-and-swap por `version` e testes com concorrencia real.
- Vazamento de MFE nao autorizado por preload indevido. Mitigacao: nao registrar remotes fora do catalogo devolvido pelo BFF e bloquear navegacao antes de qualquer import dinamico.

### Requisitos Especiais

- Performance: leitura p95 de permissoes em Redis <= 5 ms em ambiente dev; falhas devem cair para recarga do banco apenas em rotas administrativas ou miss controlado.
- Seguranca: nenhum token em log, query string, localStorage, sessionStorage ou payload de resposta.
- Compatibilidade: Java e .NET devem compartilhar um contrato documental unico de permissoes e codigos de erro observaveis.

### Conformidade com Padroes

- React: aderente a estrutura feature-based e telemetria descritas nas regras do projeto.
- Java: alinhado a Clean/Hexagonal Architecture, Spring Boot 3+, Actuator, Testcontainers e validacao JWT local.
- .NET: alinhado a Clean Architecture, CQRS nativo, health checks, testing com xUnit e contratos HTTP padronizados.
- Containers: uso de imagens oficiais, multi-stage e execucao non-root conforme boas praticas.
- Desvios declarados:
  - O template menciona referencias a Go; ignorado por inadequacao tecnica ao contexto real.
  - Roles em minusculo preservadas por imposicao do PRD, embora conflitem com a convencao global do repositorio.
  - O ambiente local da PoC passa a exigir `Traefik` reverso com TLS valido; a excecao `Secure=false` foi removida por ser tecnicamente inferior.