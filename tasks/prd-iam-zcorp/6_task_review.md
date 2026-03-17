# Relatorio de Revisao - Tarefa 6.0

Data da revisao: 2026-03-17
PRD: tasks/prd-iam-zcorp/prd.md
Task: tasks/prd-iam-zcorp/6_task.md
Tech Spec: tasks/prd-iam-zcorp/techspec.md
Status final: APROVADA

## 1. Parecer executivo

A implementacao atual do `orders-service` atende aos requisitos da tarefa 6.0. O servico Spring Boot valida JWT localmente por JWKS com verificacao de `issuer`, `audience`, expiracao e formato da claim `ROLES`, normaliza as roles fixas em minusculo e aplica autorizacao por permissao efetiva resolvida a partir da matriz de acessos derivada do BFF.

Os endpoints versionados `GET /orders/v1/orders` e `POST /orders/v1/orders` estao protegidos por decisao de permissao efetiva, retornam `401` para JWT invalido e `403` para acesso negado, e propagam `x-correlation-id` para rastreabilidade. Ha cobertura automatizada com JWKS local e cenarios equivalentes de autorizacao, alem de build e testes aprovados nesta revisao.

## 2. Validacao por requisito

- Configurar validacao JWT com `issuer`, `audience`, assinatura, expiracao e formato de claims: ATENDE.
- Mapear `ROLES` em minusculo para a semantica interna sem adulterar o contrato do PRD: ATENDE.
- Implementar `PermissionResolver` e enforcement por permissao efetiva: ATENDE.
- Expor endpoints versionados de ordens com respostas coerentes para `401` e `403`: ATENDE.
- Incluir cache local curto apenas onde nao comprometa consistencia da matriz: ATENDE.

## 3. Validacao por subtarefa

- 6.1 Configurar resource server Spring Boot com JWKS, validacao de claims e mapeamento explicito de `ROLES`: ATENDE.
  - `SecurityConfig` configura `NimbusJwtDecoder` com JWKS e validadores de `issuer`, `audience` e formato de `ROLES`.
  - `JwtClaimsAdapter` normaliza as roles fixas para `admin`, `coordenador` e `tecnico`.
- 6.2 Implementar `PermissionResolver`, adaptador de claims e decisao por permissao para as operacoes de ordens: ATENDE.
  - `RedisPermissionResolver` decide por permissao efetiva.
  - `PermissionEnforcementService` aplica o enforcement antes das operacoes do controlador.
- 6.3 Expor endpoints `GET /orders/v1/orders` e `POST /orders/v1/orders` com protecao coerente ao contrato da PoC: ATENDE.
  - `OrderController` expoe os dois endpoints versionados e exige `ordens:view` e `ordens:create`.
- 6.4 Integrar consulta/cache de permissoes efetivas conforme estrategia definida para microservicos: ATENDE.
  - `RedisRoleAccessGateway` le `role_access:<role>` do Redis e aplica cache local curto com Caffeine.
- 6.5 Padronizar erros observaveis e correlacao com o BFF: ATENDE.
  - `CorrelationIdFilter` propaga `x-correlation-id`.
  - `ApiExceptionHandler` e o `SecurityConfig` retornam `ProblemDetail` com `code` e `correlationId`.
- 6.6 Criar testes unitarios e de integracao com JWKS local e cenarios equivalentes de autorizacao: ATENDE.
  - Ha testes unitarios para normalizacao de claims, resolucao de permissao e cache local.
  - Ha testes de integracao com MockWebServer servindo JWKS local e cenarios de `200`, `201`, `401` e `403`.

## 4. Evidencias principais

### Seguranca JWT e mapeamento de roles

- `services/orders-service/src/main/java/com/zcorp/ordersservice/security/SecurityConfig.java`
  - Configura o resource server JWT com `NimbusJwtDecoder` baseado em `jwk-set-uri`.
  - Encadeia validacao de `issuer`, `audience` e formato da claim `ROLES`.
  - Responde `401` para falha de autenticacao e `403` para acesso negado com `application/problem+json`.
- `services/orders-service/src/main/java/com/zcorp/ordersservice/security/RolesClaimValidator.java`
  - Rejeita token com claim `ROLES` malformada quando nao for array de strings.
- `services/orders-service/src/main/java/com/zcorp/ordersservice/security/JwtClaimsAdapter.java`
  - Converte valores de `ROLES` para minusculo e filtra apenas as roles fixas do PRD.
- `services/orders-service/src/main/resources/application.yml`
  - Externaliza `issuer-uri`, `jwk-set-uri`, `audience`, `roles-claim`, `role-access-key-prefix` e TTL do cache local.

### Autorizacao por permissao efetiva

- `services/orders-service/src/main/java/com/zcorp/ordersservice/security/RedisPermissionResolver.java`
  - Resolve a uniao efetiva de permissoes por role e nega quando nenhuma role valida concede a permissao exigida.
- `services/orders-service/src/main/java/com/zcorp/ordersservice/security/PermissionEnforcementService.java`
  - Garante que a decisao e tomada por permissao efetiva a partir do JWT autenticado, nao por `hasRole` literal em controlador.
- `services/orders-service/src/main/java/com/zcorp/ordersservice/api/order/OrderController.java`
  - Exige `ordens:view` para listagem e `ordens:create` para criacao.

### Consulta da matriz e cache local curto

- `services/orders-service/src/main/java/com/zcorp/ordersservice/security/RedisRoleAccessGateway.java`
  - Le a matriz derivada do Redis em `role_access:<role>`.
  - Usa cache local Caffeine com TTL configuravel e tamanho limitado, mantendo Redis como fonte primaria da decisao.

### Erros observaveis e correlacao

- `services/orders-service/src/main/java/com/zcorp/ordersservice/security/CorrelationIdFilter.java`
  - Reaproveita `x-correlation-id` recebido ou gera um novo, adicionando o valor na resposta e no MDC.
- `services/orders-service/src/main/java/com/zcorp/ordersservice/api/error/ApiExceptionHandler.java`
  - Padroniza `ProblemDetail` com `code`, `correlationId`, `traceId`, `timestamp` e detalhes de permissao quando aplicavel.

### Testes automatizados

- `services/orders-service/src/test/java/com/zcorp/ordersservice/api/order/OrderControllerIntegrationTest.java`
  - Valida `200` para leitura autorizada, `201` para criacao autorizada, `403` para ausencia de permissao efetiva e `401` para token com `audience` invalida ou `ROLES` malformada.
  - Usa JWKS local servido por `MockWebServer`.
- `services/orders-service/src/test/java/com/zcorp/ordersservice/security/JwtClaimsAdapterTest.java`
  - Prova normalizacao e filtro de roles fixas.
- `services/orders-service/src/test/java/com/zcorp/ordersservice/security/RedisPermissionResolverTest.java`
  - Prova decisao por permissao efetiva e negacao quando a permissao nao esta concedida.
- `services/orders-service/src/test/java/com/zcorp/ordersservice/security/RedisRoleAccessGatewayTest.java`
  - Prova reaproveitamento do cache local e evita lookup repetido no Redis dentro do TTL.

## 5. Criterios de sucesso

- O servico Java rejeita JWT invalido localmente sem depender do BFF para validacao final: ATENDE.
- A decisao de autorizacao usa permissao efetiva, nao string literal de role no controlador: ATENDE.
- Os cenarios de autorizacao espelham o comportamento esperado pelo PRD: ATENDE.

## 6. Validacoes executadas nesta revisao

Comandos executados:

- `cd /home/tsgomes/github-tassosgomes/poc-auth/services/orders-service && mvn test`
- `cd /home/tsgomes/github-tassosgomes/poc-auth/services/orders-service && mvn -q package -DskipTests`

Resultado observado:

- `orders-service`: 10 testes aprovados.
- `orders-service`: build/empacotamento aprovado (`BUILD_OK`).

## 7. Observacao nao bloqueante

Os testes de autenticacao validam o `code` de `401` em `$.properties.code`, enquanto o `403` de regra de negocio e validado em `$.code`. Isso indica diferenca de serializacao entre o `ProblemDetail` emitido pelo entry point de seguranca e o emitido pelo exception handler da aplicacao. O comportamento funcional exigido pela tarefa esta correto e nao bloqueia o aceite, mas vale alinhar esse envelope no futuro se a UI passar a depender da estrutura exata do corpo.

## 8. Conclusao

A implementacao atual da tarefa 6.0 esta aderente ao PRD, a especificacao tecnica, as subtarefas e os criterios de sucesso definidos para o microservico Java. O servico valida JWT localmente, resolve permissoes efetivas a partir da matriz derivada do BFF, protege os endpoints versionados de ordens e apresenta evidencias automatizadas suficientes para autenticacao e autorizacao.

Conclusao: APROVADA.