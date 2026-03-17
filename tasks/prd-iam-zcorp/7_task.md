---
status: pending
parallelizable: true
blocked_by: ["1.0", "3.0"]
---

<task_context>
<domain>services/dotnet/reports-authz</domain>
<type>implementation</type>
<scope>middleware</scope>
<complexity>high</complexity>
<dependencies>external_apis,http_server</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 7.0: Implementar reports-service .NET com JWT e autorizacao por permissao

## Relacionada as User Stories

- [HU02] Como usuario, quero visualizar apenas menus e acoes permitidos para minha role. (cobertura parcial)
- [HU05] Como desenvolvedor de microservico, quero receber um JWT valido no header Authorization sem depender de conhecimento sobre sessao web. (cobertura direta)

## Visao Geral

Implementar o microservico .NET com validacao JWT por JWKS, adaptacao robusta da claim `ROLES` e enforcement consistente com o servico Java. Divergencia entre runtimes aqui nao seria detalhe de framework; seria falha de rigor na garantia central da PoC.

## Requisitos

- Configurar autenticacao JWT bearer com validacao de emissor, audiencia, assinatura e expiracao.
- Implementar `IPermissionResolver` e regras por permissao efetiva equivalentes as do servico Java.
- Expor endpoints versionados de relatorios protegidos por JWT e permissao.
- Produzir respostas HTTP coerentes para `401`, `403` e falhas internas relevantes.
- Cobrir cenarios equivalentes aos testes do servico Java.

## Subtarefas

- [ ] 7.1 Configurar ASP.NET Core com JWT Bearer, JWKS e normalizacao do mapeamento da claim `ROLES`.
- [ ] 7.2 Implementar `IPermissionResolver` e pipeline de autorizacao baseada em permissao efetiva.
- [ ] 7.3 Expor endpoints `GET /reports/v1/reports` e `GET /reports/v1/reports/{id}` com protecao consistente.
- [ ] 7.4 Integrar consulta/cache de permissoes efetivas sem transformar cache local em autoridade indevida.
- [ ] 7.5 Padronizar tratamento de erros, problem details e correlacao observavel.
- [ ] 7.6 Criar testes unitarios e de integracao com JWKS local e paridade de cenarios com o servico Java.

## Sequenciamento

- Bloqueado por: 1.0, 3.0
- Desbloqueia: 9.0
- Paralelizavel: Sim (deve evoluir em paralelo com 6.0 para expor rapidamente divergencias entre runtimes)

## Rastreabilidade

- Esta tarefa cobre: HU02, HU05
- Evidencia esperada: endpoints protegidos, testes de JWT/permission resolver e demonstracao de paridade de decisao com o servico Java.

## Detalhes de Implementacao

- Preservar o contrato de roles em minusculo e converter apenas no adaptador interno, se necessario.
- Aplicar convencoes de quality gate .NET para cancellation, problem details e health checks quando pertinente.
- Garantir que logs e traces nao exponham token nem cookie.

## Criterios de Sucesso

- O servico .NET valida JWT localmente e aplica a mesma regra de permissao do servico Java.
- Os testes equivalentes entre os dois runtimes convergem para a mesma decisao de acesso.
- O servico responde com codigos e envelopes consistentes para falhas de autenticacao e autorizacao.
