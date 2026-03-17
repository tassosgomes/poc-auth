---
status: pending
parallelizable: false
blocked_by: []
---

<task_context>
<domain>engine/infra/contracts</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database,http_server,external_apis</dependencies>
<unblocks>"2.0, 3.0, 4.0, 6.0, 7.0, 9.0"</unblocks>
</task_context>

# Tarefa 1.0: Definir contratos compartilhados e baseline de ambiente

## Relacionada as User Stories

- [HU05] Como desenvolvedor de microservico, quero receber um JWT valido no header Authorization sem depender de conhecimento sobre sessao web. (cobertura parcial)
- [HU06] Como desenvolvedor frontend, quero que o shell carregue dinamicamente apenas os microfrontends autorizados ao usuario. (cobertura parcial)
- [HU07] Como desenvolvedor, quero executar a PoC localmente via Docker Compose e implantar em Kubernetes com manifests basicos. (cobertura parcial)

## Visao Geral

Estabelecer os contratos tecnicos comuns da PoC: modelos de sessao, snapshot de permissao, catalogo de microfrontends, codigos de erro, convencoes de claims e configuracoes por ambiente. Esta tarefa elimina uma omissao de fundamentos recorrente em projetos distribuidos: permitir que cada componente invente seu proprio contrato e depois tratar a incompatibilidade como detalhe de integracao.

## Requisitos

- Consolidar modelos canonicos para sessao, role access, permission snapshot, catalogo de MFEs e envelope de erro do BFF.
- Documentar explicitamente o mapeamento da claim `ROLES` em minusculo para Java, .NET e BFF.
- Definir variaveis de ambiente minimas para shell, BFF, Redis, banco, CyberArk e Traefik.
- Registrar a excecao arquitetural que preserva roles em minusculo por imposicao do PRD.
- Definir catalogo inicial de microfrontends e seed funcional coerente com o PRD.

## Subtarefas

- [x] 1.1 Consolidar contratos TypeScript para sessao, permissao, microfrontends e erros do BFF.
- [x] 1.2 Publicar contrato documental compartilhado para claims, roles fixas e semantica de autorizacao efetiva.
- [x] 1.3 Definir configuracao por ambiente e placeholders de secrets para OIDC, Redis, banco e Traefik.
- [x] 1.4 Registrar ADR curta justificando Redis como cache operacional e banco relacional como fonte de verdade de `role_access`.
- [x] 1.5 Definir seed inicial da matriz de acessos e catalogo de MFEs autorizaveis.
- [x] 1.6 Criar testes unitarios dos serializadores/validadores de contrato e fixtures compartilhadas.

## Sequenciamento

- Bloqueado por: Nenhum
- Desbloqueia: 2.0, 3.0, 4.0, 6.0, 7.0, 9.0
- Paralelizavel: Nao (estabelece o contrato minimo que torna o restante executavel sem retrabalho)

## Rastreabilidade

- Esta tarefa cobre: HU05, HU06, HU07
- Evidencia esperada: contratos versionados, ADR/documentacao, fixtures compartilhadas e testes de validacao de schema/serializacao.

## Detalhes de Implementacao

- Basear os contratos em `UserSession`, `RoleAccessConfig`, `PermissionSnapshot`, `MicrofrontendCatalogItem` e `PermissionDecision` definidos na Tech Spec.
- Incluir os codigos obrigatorios `OIDC_CALLBACK_INVALID`, `SESSION_NOT_FOUND`, `SESSION_EXPIRED`, `TOKEN_REFRESH_FAILED`, `FORBIDDEN`, `SESSION_STORE_UNAVAILABLE` e `UPSTREAM_ERROR`.
- Garantir que o catalogo de MFEs tenha `id`, `route`, `entry`, `scope`, `module` e `requiredPermissions`.

## Criterios de Sucesso

- Todos os componentes passam a depender de contratos explicitamente versionados, sem payloads ad hoc.
- O seed inicial reflete exatamente as roles e telas definidas no PRD.
- Existe documentacao inequivoca das claims e das variaveis de ambiente minimas da PoC.

## Status de Conclusao

- [x] 1.0 Definir contratos compartilhados e baseline de ambiente ✅ CONCLUIDA
	- [x] 1.1 Implementacao completada
	- [x] 1.2 Definicao da tarefa, PRD e tech spec validados
	- [x] 1.3 Analise de regras e conformidade verificadas
	- [x] 1.4 Revisao de codigo completada
	- [x] 1.5 Pronto para deploy
