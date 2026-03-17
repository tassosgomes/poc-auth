---
status: pending
parallelizable: false
blocked_by: ["2.0", "3.0"]
---

<task_context>
<domain>frontend/shell/bootstrap</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>http_server,external_apis</dependencies>
<unblocks>"5.0, 9.0"</unblocks>
</task_context>

# Tarefa 4.0: Construir shell React com bootstrap de sessao e navegacao protegida

## Relacionada as User Stories

- [HU01] Como usuario, quero autenticar via CyberArk Identity para acessar a aplicacao sem gerenciar credenciais localmente. (cobertura parcial)
- [HU02] Como usuario, quero visualizar apenas menus e acoes permitidos para minha role. (cobertura direta)
- [HU04] Como administrador funcional, quero configurar quais telas e microfrontends cada role pode acessar sem alterar o conjunto de roles existente. (cobertura parcial)
- [HU06] Como desenvolvedor frontend, quero que o shell carregue dinamicamente apenas os microfrontends autorizados ao usuario. (cobertura direta)

## Visao Geral

Construir o shell React responsavel por bootstrap de sessao, chamada a `GET /api/permissions`, composicao da navegacao e tratamento de estados de autenticacao, expiracao e acesso negado. Qualquer shell que use menus hardcoded enquanto o contrato de permissoes existe seria uma arquitetura precaria travestida de adiantamento.

## Requisitos

- Implementar fluxo inicial de entrada e redirecionamento para `GET /api/auth/login`.
- Consumir `GET /api/permissions` no bootstrap e derivar menus, rotas e indicacao de roles efetivas.
- Tratar `401` com mensagem clara e redirecionamento para novo login.
- Tratar `403` com feedback explicito ao usuario.
- Preservar navegacao por teclado, labels semanticos e responsividade minima.

## Subtarefas

- [ ] 4.1 Estruturar shell React com roteamento, pagina de entrada e bootstrap de sessao.
- [ ] 4.2 Implementar cliente HTTP do BFF com tratamento centralizado de `401`, `403` e erros operacionais.
- [ ] 4.3 Implementar store/estado de `PermissionSnapshot` e composicao dinamica de menu, dashboard e indicadores de roles.
- [ ] 4.4 Implementar guardas de rota para recursos autorizados e tela de acesso negado.
- [ ] 4.5 Implementar estados de carregamento, sessao expirada e indisponibilidade temporaria.
- [ ] 4.6 Criar testes unitarios/RTL cobrindo bootstrap, guards e renderizacao condicional de menus.

## Sequenciamento

- Bloqueado por: 2.0, 3.0
- Desbloqueia: 5.0, 9.0
- Paralelizavel: Nao (consolida o fluxo de autenticacao e navegacao sobre contratos ja entregues pelo BFF)

## Rastreabilidade

- Esta tarefa cobre: HU01, HU02, HU04, HU06
- Evidencia esperada: shell funcional autenticando via BFF, menus derivados de `GET /api/permissions` e testes cobrindo sessao expirada/acesso negado.

## Detalhes de Implementacao

- O shell nao deve inferir MFEs autorizados fora da resposta do BFF.
- O cliente deve operar exclusivamente com cookie de sessao e nunca persistir dados sensiveis em `localStorage` ou `sessionStorage`.
- Incluir instrumentacao para correlacao de requests quando a telemetria estiver habilitada.

## Criterios de Sucesso

- A navegacao inicial e os menus refletem exatamente o snapshot retornado pelo BFF.
- A UI nao exibe nem tenta navegar para rotas nao autorizadas.
- O comportamento de erro diferencia autenticacao expirada, acesso negado e falha temporaria.
