---
status: pending
parallelizable: true
blocked_by: ["2.0", "3.0"]
---

<task_context>
<domain>engine/auth/hardening-observability</domain>
<type>integration</type>
<scope>performance</scope>
<complexity>high</complexity>
<dependencies>database,http_server,external_apis</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 8.0: Endurecer refresh, logout global, erros e observabilidade

## Relacionada as User Stories

- [HU03] Como admin, quero encerrar todas as minhas sessoes ativas imediatamente por meio de logout global. (cobertura direta)
- [HU05] Como desenvolvedor de microservico, quero receber um JWT valido no header Authorization sem depender de conhecimento sobre sessao web. (cobertura parcial)

## Visao Geral

Fechar os pontos de maior risco operacional da PoC: refresh concorrente com lock por sessao, logout global com indice reverso, normalizacao final de erros, correlacao e metricas minimas. Ignorar esta etapa seria aceitar uma arquitetura fraca exatamente nas fronteiras onde a carga e a falha expoem o sistema.

## Requisitos

- Implementar refresh controlado com lock curto por sessao e double-check apos aquisicao do lock.
- Garantir refresh token rotation atomica e descarte definitivo do token anterior.
- Implementar `POST /api/logout` e `POST /api/logout/global` com invalidacao imediata no Redis.
- Emitir logs estruturados e metricas minimas definidas na Tech Spec.
- Padronizar envelopes de erro do BFF para sessao, autenticacao e upstream.

## Subtarefas

- [ ] 8.1 Implementar `withRefreshLock` com compare-and-swap por `version` e double-check da sessao antes do refresh.
- [ ] 8.2 Implementar refresh token rotation atomica e regras para falha definitiva de refresh.
- [ ] 8.3 Implementar logout local e logout global usando `user_sessions:<userId>` e limpeza do cookie corrente.
- [ ] 8.4 Consolidar middleware de erro, `correlationId`, logging JSON e metricas operacionais minimas.
- [ ] 8.5 Garantir propagacao de correlacao entre shell, BFF, Java e .NET.
- [ ] 8.6 Criar testes de integracao para concorrencia de refresh, invalidacao global e envelopes padronizados de erro.

## Sequenciamento

- Bloqueado por: 2.0, 3.0
- Desbloqueia: 9.0
- Paralelizavel: Sim (pode ocorrer em paralelo com 5.0, desde que a base do BFF ja exista)

## Rastreabilidade

- Esta tarefa cobre: HU03, HU05
- Evidencia esperada: testes de concorrencia, prova de logout global invalidando todas as sessoes, logs JSON correlacionados e metricas minimas expostas.

## Detalhes de Implementacao

- Usar `lock:refresh:<sessionId>` com TTL curto e releitura da sessao apos adquirir o lock.
- Falha definitiva de refresh deve resultar em limpeza controlada da sessao e resposta `401 TOKEN_REFRESH_FAILED`.
- Medir pelo menos `iam_token_refresh_total`, `iam_token_refresh_conflicts_total`, `iam_session_active_total` e `iam_permission_resolution_duration_ms`.

## Criterios de Sucesso

- Duas requisicoes simultaneas proximas da expiracao nao corrompem a sessao nem o refresh token.
- Logout global invalida imediatamente todas as sessoes do usuario no Redis.
- O BFF se torna observavel e suas falhas ficam discriminaveis por codigo, correlacao e metrica.
