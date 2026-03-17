---
status: pending
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>engine/auth/bff-session</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>external_apis,http_server,database</dependencies>
<unblocks>"4.0, 8.0, 9.0"</unblocks>
</task_context>

# Tarefa 2.0: Implementar autenticacao OIDC e sessao stateful no BFF

## Relacionada as User Stories

- [HU01] Como usuario, quero autenticar via CyberArk Identity para acessar a aplicacao sem gerenciar credenciais localmente. (cobertura direta)
- [HU03] Como admin, quero encerrar todas as minhas sessoes ativas imediatamente por meio de logout global. (cobertura parcial)
- [HU05] Como desenvolvedor de microservico, quero receber um JWT valido no header Authorization sem depender de conhecimento sobre sessao web. (cobertura parcial)

## Visao Geral

Implementar o nucleo do BFF: login OIDC com PKCE, callback, sessao stateful em Redis, cookie opaco e proxy autenticado minimo para os servicos a jusante. Qualquer tentativa de postergar este nucleo e construir UI antes dele seria uma solucao rudimentar que mascara a ausencia do fluxo real de seguranca.

## Requisitos

- Implementar `GET /api/auth/login` e `GET /api/auth/callback` com `state`, `nonce` e `code_verifier` persistidos de forma segura.
- Persistir `access_token`, `refresh_token`, `id_token`, expiracoes, `absoluteExpiresAt`, `lastAccessAt` e `version` no Redis.
- Emitir somente cookie opaco com `HttpOnly`, `Secure`, `SameSite=Strict` e `Path=/`.
- Implementar proxy autenticado inicial para `/api/java/*` e `/api/dotnet/*`.
- Tratar erros de callback e sessao com envelope padronizado do BFF.

## Subtarefas

- [ ] 2.1 Implementar cliente OIDC com Authorization Code Flow + PKCE e configuracao de endpoints do CyberArk.
- [ ] 2.2 Implementar armazenamento de sessao em Redis com TTL alinhado ao refresh token, expiracao absoluta e indice `user_sessions`.
- [ ] 2.3 Implementar callback OIDC, criacao de sessao, setagem e limpeza de cookie opaco.
- [ ] 2.4 Implementar middleware de autenticacao do BFF e proxy minimo para Java e .NET com injecao de `Authorization: Bearer`.
- [ ] 2.5 Padronizar respostas `401/503/502` ligadas a callback, sessao e indisponibilidade do store.
- [ ] 2.6 Criar testes unitarios e de integracao para login, callback invalido, serializacao de sessao e proxy autenticado.

## Sequenciamento

- Bloqueado por: 1.0
- Desbloqueia: 4.0, 8.0, 9.0
- Paralelizavel: Sim (pode evoluir em paralelo com 3.0 apos estabilizacao dos contratos comuns)

## Rastreabilidade

- Esta tarefa cobre: HU01, HU03, HU05
- Evidencia esperada: fluxo de login funcional, cookie seguro emitido pelo BFF, sessao persistida no Redis e testes de callback/proxy cobrindo cenarios invalidos.

## Detalhes de Implementacao

- Implementar `SessionStore`, `OidcClient` e middleware de sessao conforme interfaces definidas na Tech Spec.
- Respeitar o callback oficial `https://api-authpoc.tasso.dev.br/api/auth/callback` e a emissao exclusiva de cookie no host do BFF.
- Preparar a estrutura de `withRefreshLock`, ainda que o comportamento completo seja endurecido na tarefa 8.0.

## Criterios de Sucesso

- O navegador nao recebe tokens em JSON, query string, header customizado ou armazenamento web.
- Um login valido resulta em cookie opaco e sessao persistida no Redis com metadados completos.
- Falhas de callback e indisponibilidade do Redis retornam codigos padronizados e observaveis.
