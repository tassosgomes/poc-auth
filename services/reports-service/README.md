# reports-service

Microservico ASP.NET Core 8 da PoC IAM ZCorp responsavel pelos endpoints protegidos de relatorios.

## Endpoints

- `GET /reports/v1/reports`
- `GET /reports/v1/reports/{id}`
- `GET /health/live`
- `GET /health/ready`

## Configuracao

Variaveis principais:

- `ReportsService__Security__IssuerUri`
- `ReportsService__Security__JwkSetUri`
- `ReportsService__Security__Audience`
- `ReportsService__Security__RolesClaim`
- `ReportsService__Authz__RoleAccessKeyPrefix`
- `ReportsService__Authz__LocalCacheTtl`
- `ReportsService__RedisUrl`

## Execucao

```bash
cd services/reports-service/src/ReportsService.Api
dotnet run
```

## Testes

```bash
cd services/reports-service
dotnet test tests/ReportsService.Api.UnitTests/ReportsService.Api.UnitTests.csproj
dotnet test tests/ReportsService.Api.IntegrationTests/ReportsService.Api.IntegrationTests.csproj
```