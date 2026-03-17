---
status: pending
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>engine/auth/authorization-store</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database,http_server</dependencies>
<unblocks>"4.0, 5.0, 6.0, 7.0, 8.0, 9.0"</unblocks>
</task_context>

# Tarefa 3.0: Implementar matriz dinamica de acessos e administracao no BFF

## Relacionada as User Stories

- [HU02] Como usuario, quero visualizar apenas menus e acoes permitidos para minha role. (cobertura direta)
- [HU04] Como administrador funcional, quero configurar quais telas e microfrontends cada role pode acessar sem alterar o conjunto de roles existente. (cobertura direta)
- [HU06] Como desenvolvedor frontend, quero que o shell carregue dinamicamente apenas os microfrontends autorizados ao usuario. (cobertura parcial)

## Visao Geral

Implementar a fonte de verdade da autorizacao da PoC: persistencia relacional de `role_access`, auditoria basica, cache derivado em Redis e endpoints administrativos protegidos. Tratar Redis como fonte de verdade aqui seria tecnicamente insustentavel e comprometeria versionamento, rastreabilidade e recuperacao.

## Requisitos

- Criar schema/migrations para `role_access` e `role_access_audit`.
- Implementar seed inicial coerente com `admin`, `coordenador` e `tecnico`.
- Implementar `GET /api/permissions`, `GET /api/admin/role-access` e `PUT /api/admin/role-access/:role`.
- Resolver uniao de permissoes para multiplas roles e allow-list estrita.
- Invalidar cache por versao, nunca por exclusao cega isolada.

## Subtarefas

- [ ] 3.1 Criar schema relacional, migrations e seed inicial da matriz de acessos por role.
- [ ] 3.2 Implementar `PermissionService` com leitura do banco, cache Redis derivado e composicao por uniao de roles validas.
- [ ] 3.3 Implementar `GET /api/permissions` retornando `permissions`, `screens`, `routes` e catalogo de MFEs filtrado.
- [ ] 3.4 Implementar endpoints administrativos com auditoria, `version` incremental e autorizacao por permissao administrativa.
- [ ] 3.5 Implementar invalidacao deterministica de cache e regras para roles desconhecidas ou ausencia total de roles validas.
- [ ] 3.6 Criar testes de integracao para leitura, atualizacao, auditoria e reflexo imediato em nova consulta de permissao.

## Sequenciamento

- Bloqueado por: 1.0
- Desbloqueia: 4.0, 5.0, 6.0, 7.0, 8.0, 9.0
- Paralelizavel: Sim (pode ser executada em paralelo com 2.0, desde que os contratos comuns estejam estabilizados)

## Rastreabilidade

- Esta tarefa cobre: HU02, HU04, HU06
- Evidencia esperada: migrations aplicadas, seed validado, endpoints administrativos protegidos, auditoria persistida e testes provando uniao de permissoes e invalidacao de cache.

## Detalhes de Implementacao

- Modelar `role_access` com colunas JSON e `version`, `updated_at`, `updated_by`.
- Modelar `role_access_audit` com valores anterior/novo e `correlation_id`.
- Implementar `permission_snapshot:<userId>:<sessionVersion>` e `role_access_cache:<role>:<version>` como caches derivados.

## Criterios de Sucesso

- Qualquer alteracao administrativa reflete em nova consulta de permissao sem redeploy.
- Roles invalidas sao ignoradas e registradas sem contaminar a decisao final.
- O BFF retorna apenas rotas e microfrontends autorizados para o usuario corrente.
