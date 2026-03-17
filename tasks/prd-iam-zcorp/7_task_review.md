# Relatorio de Revisao - Tarefa 7.0

Data da revisao: 2026-03-17
PRD: tasks/prd-iam-zcorp/prd.md
Task: tasks/prd-iam-zcorp/7_task.md
Tech Spec: tasks/prd-iam-zcorp/techspec.md
Status final: APROVADA

## 1. Parecer executivo

A implementacao atual do `reports-service` atende aos requisitos da tarefa 7.0. O microservico ASP.NET Core 8 valida JWT localmente por JWKS com verificacao de `issuer`, `audience`, assinatura, expiracao e formato da claim `ROLES`, normaliza as roles fixas em minusculo e aplica autorizacao por permissao efetiva resolvida a partir da matriz de acessos derivada do BFF.

Os endpoints versionados `GET /reports/v1/reports` e `GET /reports/v1/reports/{id}` estao protegidos por autenticacao JWT e decisao de permissao efetiva, retornam `401` para falhas de autenticacao, `403` para ausencia de permissao efetiva e mantem correlacao observavel no envelope de erro. Ha cobertura automatizada com JWKS local, Redis efemero e cenarios equivalentes aos do servico Java para demonstrar convergencia de decisao entre runtimes.

## 2. Validacao por requisito

- Configurar autenticacao JWT bearer com validacao de emissor, audiencia, assinatura e expiracao: ATENDE.
- Implementar `IPermissionResolver` e regras por permissao efetiva equivalentes as do servico Java: ATENDE.
- Expor endpoints versionados de relatorios protegidos por JWT e permissao: ATENDE.
- Produzir respostas HTTP coerentes para `401`, `403` e falhas internas relevantes: ATENDE.
- Cobrir cenarios equivalentes aos testes do servico Java: ATENDE.

## 3. Validacao por subtarefa

- 7.1 Configurar ASP.NET Core com JWT Bearer, JWKS e normalizacao do mapeamento da claim `ROLES`: ATENDE.
  - `ConfigureJwtBearerOptions` configura validacao de `issuer`, `audience`, assinatura, expiracao e JWKS.
  - `RolesClaimValidator` rejeita claim `ROLES` malformada quando nao for array de strings.
  - `JwtClaimsAdapter` normaliza valores para as roles fixas `admin`, `coordenador` e `tecnico`.
- 7.2 Implementar `IPermissionResolver` e pipeline de autorizacao baseada em permissao efetiva: ATENDE.
  - `RedisPermissionResolver` decide acesso pela uniao efetiva de permissoes por role.
  - `PermissionEnforcementService` e `PermissionEndpointFilter` aplicam enforcement por permissao nos endpoints.
- 7.3 Expor endpoints `GET /reports/v1/reports` e `GET /reports/v1/reports/{id}` com protecao consistente: ATENDE.
  - `ReportEndpoints` expoe os dois endpoints versionados e exige `relatorios:view` para ambos.
- 7.4 Integrar consulta/cache de permissoes efetivas sem transformar cache local em autoridade indevida: ATENDE.
  - `RedisRoleAccessGateway` le `role_access:<role>` no Redis e usa cache local curto em memoria, preservando Redis como fonte primaria da decisao.
- 7.5 Padronizar tratamento de erros, problem details e correlacao observavel: ATENDE.
  - `ProblemDetailsWriter`, `GlobalExceptionHandler` e `CorrelationIdMiddleware` padronizam `application/problem+json` com `code`, `correlationId`, `traceId` e `timestamp`.
  - Ha health checks para JWKS e Redis em `/health/ready`.
- 7.6 Criar testes unitarios e de integracao com JWKS local e paridade de cenarios com o servico Java: ATENDE.
  - Ha testes unitarios para normalizacao de claims, resolucao de permissao e leitura/cache da matriz de acessos.
  - Ha testes de integracao com JWKS local e Redis em container cobrindo `200`, `401` e `403` nos mesmos eixos de validacao usados no servico Java.

## 4. Evidencias principais

### Seguranca JWT e mapeamento de roles

- `services/reports-service/src/ReportsService.Api/Program.cs`
  - Registra autenticacao JWT bearer, problem details, exception handler, Redis, health checks e middleware de correlacao.
- `services/reports-service/src/ReportsService.Api/Security/ConfigureJwtBearerOptions.cs`
  - Configura validacao local do JWT por JWKS com `issuer`, `audience`, assinatura e expiracao.
  - Responde `401` em `application/problem+json` para falha de autenticacao e `403` para acesso proibido.
- `services/reports-service/src/ReportsService.Api/Security/RolesClaimValidator.cs`
  - Rejeita token cuja claim `ROLES` esteja presente, mas nao seja array de strings.
- `services/reports-service/src/ReportsService.Api/Security/JwtClaimsAdapter.cs`
  - Converte roles para minusculo e filtra apenas o conjunto fixo do PRD.

### Autorizacao por permissao efetiva

- `services/reports-service/src/ReportsService.Api/Security/IPermissionResolver.cs`
  - Define o contrato exigido pela task e pela tech spec.
- `services/reports-service/src/ReportsService.Api/Security/RedisPermissionResolver.cs`
  - Resolve a uniao efetiva de permissoes por role e nega quando nenhuma role valida concede a permissao exigida.
- `services/reports-service/src/ReportsService.Api/Security/PermissionEnforcementService.cs`
  - Garante que a decisao de acesso seja baseada em permissao efetiva, nao em string literal de role.
- `services/reports-service/src/ReportsService.Api/Endpoints/ReportEndpoints.cs`
  - Exige `relatorios:view` antes de atender listagem e consulta por id.

### Consulta da matriz e cache local curto

- `services/reports-service/src/ReportsService.Api/Security/RedisRoleAccessGateway.cs`
  - Le a matriz derivada do Redis em `role_access:<role>`.
  - Aplica cache local curto configuravel em memoria, sem promover o cache local a fonte de verdade.

### Erros observaveis e correlacao

- `services/reports-service/src/ReportsService.Api/Infrastructure/Http/ProblemDetailsWriter.cs`
  - Padroniza os envelopes com `code`, `correlationId`, `traceId` e `timestamp`.
- `services/reports-service/src/ReportsService.Api/Infrastructure/Http/GlobalExceptionHandler.cs`
  - Trata `PermissionDeniedException`, `PermissionStoreUnavailableException`, `BadHttpRequestException` e falhas internas relevantes.
- `services/reports-service/src/ReportsService.Api/Infrastructure/Observability/CorrelationIdMiddleware.cs`
  - Reaproveita `x-correlation-id` recebido ou gera um novo, devolvendo o valor na resposta.

### Testes automatizados e paridade com Java

- `services/reports-service/tests/ReportsService.Api.UnitTests/Security/JwtClaimsAdapterTests.cs`
  - Prova normalizacao e filtro de roles fixas em minusculo.
- `services/reports-service/tests/ReportsService.Api.UnitTests/Security/RedisPermissionResolverTests.cs`
  - Prova concessao e negacao de acesso por permissao efetiva.
- `services/reports-service/tests/ReportsService.Api.UnitTests/Security/RedisRoleAccessGatewayTests.cs`
  - Prova parsing do payload Redis, cache local curto e falha para payload invalido.
- `services/reports-service/tests/ReportsService.Api.IntegrationTests/ReportsEndpointIntegrationTests.cs`
  - Valida `200` para leitura autorizada, `403` para ausencia de permissao efetiva e `401` para `audience` invalida ou claim `ROLES` malformada.
  - Usa JWKS local e Redis em container, cobrindo os mesmos vetores principais do servico Java revisado na tarefa 6.0.

## 5. Criterios de sucesso

- O servico .NET valida JWT localmente e aplica a mesma regra de permissao do servico Java: ATENDE.
- Os testes equivalentes entre os dois runtimes convergem para a mesma decisao de acesso: ATENDE.
- O servico responde com codigos e envelopes consistentes para falhas de autenticacao e autorizacao: ATENDE.

## 6. Validacoes executadas nesta revisao

Comandos executados:

- `cd /home/tsgomes/github-tassosgomes/poc-auth/services/reports-service && dotnet test tests/ReportsService.Api.UnitTests/ReportsService.Api.UnitTests.csproj --nologo`
- `cd /home/tsgomes/github-tassosgomes/poc-auth/services/reports-service && dotnet test tests/ReportsService.Api.IntegrationTests/ReportsService.Api.IntegrationTests.csproj --nologo`

Resultado observado:

- `ReportsService.Api.UnitTests`: 9 testes aprovados.
- `ReportsService.Api.IntegrationTests`: 6 testes aprovados.
- Nenhum erro de compilacao reportado no workspace de `services/reports-service`.

## 7. Observacoes nao bloqueantes

- Existem arquivos residuais de template ou placeholder que nao comprometem o aceite funcional da tarefa, como `services/reports-service/tests/ReportsService.Api.UnitTests/UnitTest1.cs`, `services/reports-service/tests/ReportsService.Api.IntegrationTests/UnitTest1.cs`, `services/reports-service/src/ReportsService.Api/WeatherForecast.cs` e `services/reports-service/src/ReportsService.Api/ReportsService.Api.http`.
- O arquivo `services/reports-service/ReportsService.slnx` esta presente, mas nao compoe evidência funcional nem foi necessario para validar a task. Vale alinhar sua estrutura depois para evitar ruído operacional.

## 8. Conclusao

A implementacao atual da tarefa 7.0 esta aderente ao PRD, a especificacao tecnica, as subtarefas e os criterios de sucesso definidos para o microservico .NET. O servico valida JWT localmente por JWKS, resolve permissoes efetivas a partir da matriz derivada do BFF, protege os endpoints versionados de relatorios e apresenta cobertura automatizada suficiente para demonstrar paridade funcional com o servico Java.

Conclusao: APROVADA.