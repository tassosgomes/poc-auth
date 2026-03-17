---
status: pending
parallelizable: true
blocked_by: ["3.0", "4.0"]
---

<task_context>
<domain>frontend/microfrontends/runtime</domain>
<type>integration</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>http_server</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 5.0: Entregar microfrontends remotos com carregamento autorizado

## Relacionada as User Stories

- [HU02] Como usuario, quero visualizar apenas menus e acoes permitidos para minha role. (cobertura parcial)
- [HU04] Como administrador funcional, quero configurar quais telas e microfrontends cada role pode acessar sem alterar o conjunto de roles existente. (cobertura direta)
- [HU06] Como desenvolvedor frontend, quero que o shell carregue dinamicamente apenas os microfrontends autorizados ao usuario. (cobertura direta)

## Visao Geral

Implementar os remotes via Module Federation e o loader autorizado, garantindo que o shell nao importe nem requisite artefatos remotos fora do catalogo filtrado pelo BFF. Preload indiscriminado aqui seria um risco operacional severo e uma violacao direta do PRD.

## Requisitos

- Criar remotes `mfe-dashboard`, `mfe-ordens`, `mfe-relatorios` e `mfe-admin-acessos`.
- Padronizar manifesto remoto com `id`, `route`, `entry`, `scope`, `module` e `requiredPermissions`.
- Bloquear import dinamico para qualquer remoto ausente do catalogo autorizado.
- Garantir que a tela administrativa seja carregada apenas para usuarios autorizados.
- Provar que o shell nao requisita artefatos nao autorizados.

## Subtarefas

- [ ] 5.1 Configurar Module Federation para shell e remotes com contrato comum de bootstrap.
- [ ] 5.2 Implementar os remotes iniciais de dashboard, ordens, relatorios e administracao de acessos.
- [ ] 5.3 Implementar loader autorizado baseado exclusivamente no catalogo retornado pelo BFF.
- [ ] 5.4 Bloquear navegacao e importacao de remotes fora do conjunto autorizado, inclusive por URL manual.
- [ ] 5.5 Integrar a tela administrativa ao endpoint de configuracao de acessos por role.
- [ ] 5.6 Criar testes de integracao/E2E validando ausencia de requests para remotes nao autorizados.

## Sequenciamento

- Bloqueado por: 3.0, 4.0
- Desbloqueia: 9.0
- Paralelizavel: Sim (pode evoluir em paralelo com o endurecimento operacional da tarefa 8.0)

## Rastreabilidade

- Esta tarefa cobre: HU02, HU04, HU06
- Evidencia esperada: remotes publicados, loader autorizado funcional, tela administrativa protegida e testes comprovando que artefatos nao autorizados nao sao requisitados.

## Detalhes de Implementacao

- O shell deve registrar ou resolver remotes apenas apos validar o catalogo de MFEs autorizado.
- O remoto administrativo deve operar sobre `GET /api/admin/role-access` e `PUT /api/admin/role-access/:role`.
- Considerar hosting dedicado por subdominio ou entrega pelo proprio shell/BFF conforme a estrategia final definida na plataforma.

## Criterios de Sucesso

- O usuario autenticado recebe apenas os MFEs coerentes com suas permissoes efetivas.
- O shell nao emite requests de `remoteEntry.js` para modulos nao autorizados.
- Alteracoes administrativas passam a refletir os remotes disponiveis em nova consulta de permissao.
