---
status: pending
parallelizable: true
blocked_by: ["1.0", "3.0"]
---

<task_context>
<domain>services/java/orders-authz</domain>
<type>implementation</type>
<scope>middleware</scope>
<complexity>high</complexity>
<dependencies>external_apis,http_server</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 6.0: Implementar orders-service Java com JWT e autorizacao por permissao

## Relacionada as User Stories

- [HU02] Como usuario, quero visualizar apenas menus e acoes permitidos para minha role. (cobertura parcial)
- [HU05] Como desenvolvedor de microservico, quero receber um JWT valido no header Authorization sem depender de conhecimento sobre sessao web. (cobertura direta)

## Visao Geral

Implementar o microservico Java com validacao local de JWT por JWKS, mapeamento correto da claim `ROLES` e enforcement por permissao efetiva nas APIs de ordens. Limitar-se a `hasRole` cru em controlador seria negligencia arquitetural, pois a PoC exige matriz dinamica e decisao por permissao.

## Requisitos

- Configurar validacao JWT com `issuer`, `audience`, assinatura, expiracao e formato de claims.
- Mapear `ROLES` em minusculo para a semantica interna sem adulterar o contrato do PRD.
- Implementar `PermissionResolver` e enforcement por permissao efetiva.
- Expor endpoints versionados de ordens com respostas coerentes para `401` e `403`.
- Incluir cache local curto apenas onde nao comprometa consistencia da matriz.

## Subtarefas

- [ ] 6.1 Configurar resource server Spring Boot com JWKS, validacao de claims e mapeamento explicito de `ROLES`.
- [ ] 6.2 Implementar `PermissionResolver`, adaptador de claims e decisao por permissao para as operacoes de ordens.
- [ ] 6.3 Expor endpoints `GET /orders/v1/orders` e `POST /orders/v1/orders` com protecao coerente ao contrato da PoC.
- [ ] 6.4 Integrar consulta/cache de permissoes efetivas conforme estrategia definida para microservicos.
- [ ] 6.5 Padronizar erros observaveis e correlacao com o BFF.
- [ ] 6.6 Criar testes unitarios e de integracao com JWKS local e cenarios equivalentes de autorizacao.

## Sequenciamento

- Bloqueado por: 1.0, 3.0
- Desbloqueia: 9.0
- Paralelizavel: Sim (pode ser executada em paralelo com 7.0 usando o mesmo contrato de permissao)

## Rastreabilidade

- Esta tarefa cobre: HU02, HU05
- Evidencia esperada: endpoints protegidos com JWT valido, testes de autorizacao por permissao e prova de consistencia de `401/403` em cenarios equivalentes.

## Detalhes de Implementacao

- Reutilizar o contrato documental de permissao definido na tarefa 1.0.
- Aplicar cache local curto apenas como derivacao, jamais como fonte primaria de decisao sem invalidacao previsivel.
- Garantir logs estruturados sem vazamento de token.

## Criterios de Sucesso

- O servico Java rejeita JWT invalido localmente sem depender do BFF para validacao final.
- A decisao de autorizacao usa permissao efetiva, nao string literal de role no controlador.
- Os cenarios de autorizacao espelham o comportamento esperado pelo PRD.
