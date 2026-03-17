# PRD: Sistema de Identidade e Acesso (IAM) - ECAD

## 1. Visao Geral

Esta PoC implementa uma arquitetura de autenticacao e autorizacao baseada em BFF (Backend-for-Frontend) para garantir que tokens sensiveis nunca fiquem expostos ao navegador. A solucao e composta por um frontend React, um BFF em Node.js/Fastify, dois microservicos de exemplo (Java e .NET), Redis para sessao e cache de autorizacao, e artefatos de containerizacao e orquestracao para execucao local e deploy em Kubernetes.

O objetivo da PoC nao e apenas demonstrar login via CyberArk Identity, mas provar de forma rastreavel que:

- o navegador opera apenas com cookie de sessao HttpOnly;
- o BFF concentra autenticacao, renovacao de tokens e proxy autenticado;
- os microservicos validam o mesmo JWT e aplicam RBAC de forma consistente;
- a autorizacao fina nao depende de Fat Tokens;
- a solucao pode ser executada localmente e implantada em cluster Kubernetes de desenvolvimento.

## 2. Problema a Resolver

O modelo tradicional de SPA com JWT no navegador introduz risco desnecessario de exposicao de credenciais, amplia superficie para XSS e dificulta governanca de sessao. Alem disso, a inclusao de permissoes detalhadas no token compromete interoperabilidade e manutencao.

Esta PoC deve validar um modelo alternativo com os seguintes principios:

- sessao stateful no servidor;
- access token e refresh token armazenados exclusivamente no BFF/Redis;
- autorizacao baseada em roles emitidas pelo IdP e permissoes resolvidas fora do token;
- governanca dinamica de acessos por tela e modulo sem redefinicao das roles;
- frontend baseado em microfrontends com carregamento sob demanda apenas do que o usuario pode acessar;
- interoperabilidade entre runtimes distintos dentro do mesmo ambiente.

## 3. Escopo

### 3.1 Em Escopo

- Login via CyberArk Identity com Authorization Code Flow + PKCE.
- Sessao stateful no BFF com armazenamento de tokens no Redis.
- Renovacao automatica de access token com refresh token rotation.
- Proxy autenticado do BFF para microservicos Java e .NET.
- Validacao de JWT nos microservicos por JWKS.
- RBAC com tres roles: `admin`, `coordenador`, `tecnico`.
- Resolucao de permissoes via Redis para frontend e backend.
- Tela administrativa para configuracao dinamica de acessos por role, mantendo o conjunto de roles fixo.
- Logout local e logout global.
- Frontend React baseado em microfrontends, com shell principal e carregamento dinamico de MFEs por permissao.
- Dockerfiles multi-stage, `docker-compose.yml` e manifests Kubernetes basicos.
- Documento de orientacao para Netscaler CPX.

### 3.2 Fora de Escopo

- Configuracao do CyberArk Identity no ambiente corporativo.
- Desenvolvimento de integracao Sensedia.
- Configuracao YAML do Netscaler.
- Alta disponibilidade de Redis para producao.
- Helm charts.
- Pipeline CI/CD.
- Observabilidade completa com stack de coleta.
- mTLS interno no cluster.
- Testes de carga formais de producao.

## 4. Objetivos e Metricas de Sucesso

| # | Objetivo | Metrica de sucesso |
|---|---|---|
| 1 | Seguranca de sessao | Nenhum token acessivel via JavaScript; navegador recebe apenas cookie de sessao com `HttpOnly`, `Secure` e `SameSite=Strict` |
| 2 | Autorizacao enxuta | Access token contem apenas claims necessarias para identidade e roles; permissoes detalhadas nao sao embarcadas no JWT |
| 3 | Consistencia de RBAC | Frontend, BFF, microservico Java e microservico .NET tomam a mesma decisao de autorizacao para a mesma role e acao |
| 4 | Renovacao confiavel | Expiracao de access token e tratada pelo BFF sem perda de sessao em cenarios de concorrencia controlados |
| 5 | Portabilidade operacional | Todos os componentes sobem em Docker Compose e sao deployaveis em Kubernetes de desenvolvimento |
| 6 | Prontidao de infraestrutura | Existe documentacao suficiente para orientar futura integracao com Netscaler |
| 7 | Modularidade autorizada no frontend | O shell carrega apenas microfrontends autorizados para o usuario autenticado |

### 4.1 Criterios de Medicao

- O tempo de leitura de permissoes em Redis sera medido como p95 de operacoes de leitura em ambiente de desenvolvimento, considerando apenas chamadas do servico ao Redis. Meta de referencia: <= 5 ms.
- A consistencia de autorizacao sera validada por cenarios funcionais equivalentes em frontend, BFF, Java e .NET.
- A renovacao de token sera considerada correta quando duas requisicoes simultaneas em janela de expiracao nao causarem perda de sessao nem corrupcao do refresh token armazenado.
- O frontend sera considerado aderente quando nao requisitar artefatos de microfrontend nao autorizados para o usuario corrente.

## 5. Personas e Historias de Usuario

### 5.1 Usuario Final

- HU01. Como usuario, quero autenticar via CyberArk Identity para acessar a aplicacao sem gerenciar credenciais localmente.
- HU02. Como usuario, quero visualizar apenas menus e acoes permitidos para minha role.
- HU03. Como admin, quero encerrar todas as minhas sessoes ativas imediatamente por meio de logout global.
- HU04. Como administrador funcional, quero configurar quais telas e microfrontends cada role pode acessar sem alterar o conjunto de roles existente.

### 5.2 Desenvolvedor Backend

- HU05. Como desenvolvedor de microservico, quero receber um JWT valido no header `Authorization` sem depender de conhecimento sobre sessao web.
- HU06. Como desenvolvedor frontend, quero que o shell carregue dinamicamente apenas os microfrontends autorizados ao usuario.
- HU07. Como desenvolvedor, quero executar a PoC localmente via Docker Compose e implantar em Kubernetes com manifests basicos.

### 5.3 Equipe de Infraestrutura

- HU08. Como engenheiro de infraestrutura, quero um guia de orientacao para Netscaler compativel com esta arquitetura.

## 6. Decisoes Arquiteturais Obrigatorias

### 6.1 Modelo de Sessao

- O navegador nao recebe `access_token`, `refresh_token` ou `id_token` em nenhuma hipotese.
- O BFF cria uma sessao stateful no Redis identificada por `session_id` opaco.
- O cookie de sessao contem apenas o `session_id`.
- O BFF e a unica camada autorizada a trocar `authorization_code` por tokens e a renovar tokens.

### 6.2 Fronteira de Confianca

- O gateway corporativo pode validar JWT em borda, mas isso nao substitui validacao nos microservicos.
- Os microservicos Java e .NET devem validar assinatura, issuer, audience, expiracao e formato de claims localmente.
- O BFF nao e autoridade de autorizacao final para recursos de dominio; ele apenas autentica, propaga identidade e expoe permissoes para UI.

### 6.3 Modelo de Autorizacao

- A claim `ROLES` sera um array de strings.
- As roles sao fixas e predefinidas pelo sistema: `admin`, `coordenador`, `tecnico`.
- O usuario pode possuir uma ou mais roles simultaneamente.
- A resolucao de permissoes usara uniao de permissoes das roles do usuario.
- O mapeamento entre role e acessos a telas, rotas e microfrontends deve ser configuravel em tempo de execucao por usuario autorizado.
- Em caso de ausencia de role valida, o resultado e negacao total.
- O sistema adota modelo allow-list. Qualquer permissao nao explicitamente concedida e negada.

### 6.4 Frontend Modular

- O frontend deve operar com um shell principal responsavel por autenticacao, navegacao e orquestracao de microfrontends.
- Cada dominio funcional relevante deve ser entregue como microfrontend carregavel sob demanda.
- O shell nao deve carregar, importar ou requisitar artefatos de microfrontend que nao estejam autorizados para o usuario corrente.
- A lista de microfrontends autorizados deve ser derivada da resposta de autorizacao do BFF, nao de logica hardcoded no cliente.

### 6.5 Logout

- Logout local encerra apenas a sessao corrente associada ao cookie apresentado.
- Logout global invalida todas as sessoes do usuario no Redis.
- Para logout global, o sistema deve manter indice reverso `user_sessions:<userId>` para localizar todas as sessoes ativas.
- O comportamento esperado e invalidacao imediata no Redis e limpeza da sessao corrente no navegador. Revogacao no IdP e desejavel quando suportada pela integracao disponivel, mas nao e pre-requisito de aceite da PoC.

## 7. Fluxos Principais

### 7.1 Login

1. Usuario acessa a aplicacao React sem cookie de sessao valido.
2. Frontend aciona endpoint de login do BFF.
3. BFF gera `state`, `nonce` e `code_verifier`, persiste o necessario para o fluxo e redireciona ao CyberArk.
4. CyberArk autentica o usuario e redireciona ao callback do BFF com `authorization_code`.
5. BFF valida `state` e troca o codigo por tokens.
6. BFF persiste sessao no Redis e retorna cookie `session_id`.
7. Frontend consulta `GET /api/permissions` e recebe permissoes efetivas, rotas autorizadas e microfrontends permitidos.
8. O shell monta a navegacao inicial e carrega apenas os microfrontends autorizados.

### 7.2 Uso Protegido

1. Frontend chama rota protegida do BFF com cookie de sessao.
2. BFF recupera a sessao no Redis.
3. Se o access token estiver valido, injeta `Authorization: Bearer <token>` e faz proxy.
4. Se o access token estiver expirado, o BFF tenta refresh de forma controlada.
5. O microservico valida o JWT e aplica RBAC.
6. A resposta retorna ao frontend sem exposicao de tokens.
7. Se a rota requisitada depender de microfrontend ainda nao carregado, o shell carrega dinamicamente apenas o artefato autorizado correspondente.

### 7.3 Logout Local

1. Frontend chama `POST /api/logout`.
2. BFF invalida a sessao corrente no Redis.
3. BFF remove o cookie.
4. Frontend redireciona o usuario para a tela inicial.

### 7.4 Logout Global

1. Usuario autenticado chama `POST /api/logout/global`.
2. BFF identifica o `userId` da sessao corrente.
3. BFF recupera todas as sessoes associadas ao usuario via indice reverso.
4. BFF remove todas as sessoes do Redis.
5. BFF remove o cookie da sessao corrente.
6. Requisicoes subsequentes com cookies antigos devem falhar com `401 SESSION_NOT_FOUND`.

### 7.5 Configuracao Dinamica de Acessos

1. Usuario com permissao administrativa acessa a tela de configuracao de acessos.
2. O frontend carrega o microfrontend administrativo apenas se o usuario possuir permissao para esse modulo.
3. A tela exibe as roles fixas do sistema e os acessos atualmente vinculados a cada role.
4. O administrador altera acessos a telas, rotas e microfrontends por role.
5. O BFF persiste a configuracao e invalida caches pertinentes.
6. Novas sessoes e novas consultas de permissao passam a refletir a configuracao atualizada sem necessidade de redeploy.

## 8. Requisitos Funcionais

### 8.1 Autenticacao e Sessao

| ID | Requisito | Descricao |
|---|---|---|
| RF01 | Autenticacao OIDC | O BFF deve delegar autenticacao ao CyberArk Identity via Authorization Code Flow + PKCE. |
| RF02 | Sessao stateful | O BFF deve armazenar `access_token`, `refresh_token`, `id_token`, metadados de expiracao e claims minimas da sessao no Redis. |
| RF03 | Cookie de sessao | O cliente deve receber apenas um cookie opaco de sessao com `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/` e sem conteudo sensivel. |
| RF04 | Renovacao automatica | O BFF deve renovar o access token ao detectar expiracao ou janela de expiracao iminente. |
| RF05 | Refresh token rotation | A renovacao deve substituir atomica e definitivamente o refresh token anterior. |
| RF06 | Controle de concorrencia no refresh | O BFF deve impedir que requisicoes simultaneas executem refresh concorrente para a mesma sessao sem coordenacao. |
| RF07 | Logout local | `POST /api/logout` deve invalidar apenas a sessao corrente. |
| RF08 | Logout global | `POST /api/logout/global` deve invalidar todas as sessoes do usuario corrente no Redis. |

### 8.2 Autorizacao RBAC

| ID | Requisito | Descricao |
|---|---|---|
| RF09 | Claim de roles | A claim `ROLES` deve ser tratada como array de strings. |
| RF10 | Roles fixas | O sistema deve operar com conjunto fixo de roles: `admin`, `coordenador`, `tecnico`. |
| RF11 | Mapeamento dinamico de acessos | O sistema deve permitir configurar em tempo de execucao, por role, os acessos a telas, rotas, permissoes e microfrontends, sem criar novas roles. |
| RF12 | Cache de permissoes | As permissoes por role devem ser resolvidas via Redis, com possibilidade de cache local de curta duracao nos microservicos. |
| RF13 | Endpoint para frontend | `GET /api/permissions` deve retornar as permissoes efetivas do usuario autenticado, incluindo telas e microfrontends autorizados. |
| RF14 | Consistencia de decisao | Java e .NET devem aplicar a mesma regra de autorizacao para a mesma permissao. |
| RF15 | Administracao de acessos | O sistema deve expor operacoes protegidas para leitura e atualizacao do mapeamento de acessos por role. |

### 8.3 BFF

| ID | Requisito | Descricao |
|---|---|---|
| RF16 | Proxy autenticado | O BFF deve injetar o JWT no header `Authorization` ao encaminhar requisicoes autenticadas. |
| RF17 | Roteamento | O BFF deve encaminhar `/api/java/*` para o microservico Java e `/api/dotnet/*` para o microservico .NET. |
| RF18 | Normalizacao de erro | O BFF deve responder erros de autenticacao e sessao em formato padronizado. |
| RF19 | Nao exposicao de token | O BFF nao deve retornar tokens ao frontend em JSON, header customizado ou query string. |
| RF20 | Endpoint de configuracao de acessos | O BFF deve expor endpoints protegidos para consulta e atualizacao da matriz dinamica de acessos por role. |
| RF21 | Filtragem de modulos autorizados | O BFF deve retornar ao frontend apenas o catalogo de microfrontends e rotas autorizados para o usuario corrente. |

### 8.4 Frontend React

| ID | Requisito | Descricao |
|---|---|---|
| RF22 | Shell de microfrontends | O frontend deve possuir shell principal responsavel por autenticacao, navegacao e composicao dos microfrontends. |
| RF23 | Tela inicial | O frontend deve exibir tela de entrada com acao para iniciar autenticacao via BFF. |
| RF24 | Dashboard dinamico | A UI deve usar `GET /api/permissions` para exibir menus, telas e modulos disponiveis. |
| RF25 | Carregamento dinamico de MFEs | O shell deve carregar microfrontends somente sob demanda e somente quando autorizados para o usuario. |
| RF26 | Tela administrativa de acessos | O frontend deve possuir tela administrativa para configuracao dos acessos por role. |
| RF27 | Tratamento de sessao expirada | O frontend deve tratar `401` de sessao expirada exibindo mensagem clara e redirecionando para novo login. |
| RF28 | Tratamento de acesso negado | O frontend deve tratar `403` com feedback explicito ao usuario. |

### 8.5 Microservicos de Exemplo

| ID | Requisito | Descricao |
|---|---|---|
| RF29 | Microservico Java | Deve expor API de exemplo de Ordens de Servico protegida por JWT e RBAC. |
| RF30 | Microservico .NET | Deve expor API de exemplo de Relatorios protegida por JWT e RBAC. |
| RF31 | Validacao local de JWT | Ambos os microservicos devem validar JWT via JWKS do emissor configurado. |
| RF32 | Autorizacao por permissao | A decisao de acesso deve ser baseada em permissao efetiva, nao apenas em string literal de role em controlador. |

### 8.6 Infraestrutura e Operacao

| ID | Requisito | Descricao |
|---|---|---|
| RF33 | Dockerfiles | Cada componente deve possuir Dockerfile multi-stage apto a build reproducivel. |
| RF34 | Docker Compose | O repositorio deve possuir `docker-compose.yml` com frontend shell, MFEs, BFF, Java, .NET e Redis. |
| RF35 | Manifests Kubernetes | Cada componente deve possuir no minimo Deployment, Service e ConfigMap; componentes com segredo devem consumir Secret. |
| RF36 | Configuracao operacional minima | Deployments devem definir probes, requests e limits compativeis com ambiente de desenvolvimento. |
| RF37 | Documentacao Netscaler | Deve existir documento de orientacao para uso futuro do Netscaler CPX nesta arquitetura. |

## 9. Modelo de Acesso da PoC

As roles sao fixas, mas seus acessos a telas, rotas, permissoes e microfrontends sao configuraveis dinamicamente por usuario autorizado. A implementacao nao deve inferir acessos fora da configuracao persistida.

| Role | Natureza | Configuracao |
|---|---|
| `admin` | Role fixa do sistema | Pode ter acessos alterados, inclusive ao modulo administrativo |
| `coordenador` | Role fixa do sistema | Pode ter acessos alterados dentro do catalogo de telas e MFEs disponiveis |
| `tecnico` | Role fixa do sistema | Pode ter acessos alterados dentro do catalogo de telas e MFEs disponiveis |

### 9.1 Seed Inicial da PoC

| Role | Telas e MFEs inicialmente habilitados |
|---|---|
| `admin` | `dashboard`, `ordens`, `relatorios`, `admin-acessos` |
| `coordenador` | `dashboard`, `ordens`, `relatorios` |
| `tecnico` | `dashboard`, `ordens`, `relatorios` |

### 9.2 Regras de Composicao

- Usuario com multiplas roles recebe uniao de permissoes.
- Usuario com multiplas roles recebe uniao de telas, rotas e microfrontends permitidos.
- Roles desconhecidas sao ignoradas e registradas em log.
- Se nenhuma role valida restar apos normalizacao, a requisicao autenticada recebe `403 FORBIDDEN` para recursos protegidos e `GET /api/permissions` retorna lista vazia.
- Alteracoes de configuracao devem invalidar caches de autorizacao e refletir em nova consulta de permissao sem redeploy.

## 10. Contratos de Dados e Sessao

### 10.1 Estrutura da Sessao no Redis

Chave:

```text
session:<sessionId>
```

Valor minimo:

```json
{
    "sessionId": "uuid",
    "userId": "user-123",
    "roles": ["admin"],
    "accessToken": "...",
    "refreshToken": "...",
    "idToken": "...",
    "accessTokenExpiresAt": 1710000000,
    "refreshTokenExpiresAt": 1710028800,
    "createdAt": 1709990000,
    "lastAccessAt": 1709991000,
    "version": 3
}
```

Indice reverso para logout global:

```text
user_sessions:<userId> -> set(sessionId)
```

Configuracao de acessos por role:

```text
role_access:<role>
```

Valor minimo:

```json
{
    "role": "coordenador",
    "permissions": ["ORDER_READ", "ORDER_CREATE", "REPORT_READ"],
    "screens": ["dashboard", "ordens", "relatorios"],
    "routes": ["/", "/ordens", "/relatorios"],
    "microfrontends": ["mfe-dashboard", "mfe-ordens", "mfe-relatorios"],
    "updatedAt": 1710001000,
    "updatedBy": "user-admin-1",
    "version": 5
}
```

### 10.2 Politica de Expiracao

- O TTL da sessao no Redis deve ser alinhado ao `refresh_token`.
- Deve existir expiracao absoluta de sessao.
- Deve existir expiracao por inatividade.
- A renovacao de access token nao pode prolongar indefinidamente uma sessao alem do limite absoluto definido para a PoC.

### 10.3 Politica de Cookie

- `HttpOnly=true`
- `Secure=true`
- `SameSite=Strict`
- `Path=/`
- Nome de cookie configuravel por ambiente
- Em desenvolvimento local, a estrategia de HTTPS e dominios deve ser documentada no README e refletida nas variaveis de ambiente

## 11. Contratos de API

### 11.1 Endpoint de Permissoes

`GET /api/permissions`

Resposta esperada:

```json
{
    "userId": "user-123",
    "roles": ["coordenador"],
    "permissions": ["ORDER_READ", "ORDER_CREATE", "REPORT_READ"],
    "screens": ["dashboard", "ordens", "relatorios"],
    "routes": ["/", "/ordens", "/relatorios"],
    "microfrontends": [
        {
            "id": "mfe-dashboard",
            "route": "/",
            "entry": "/mfes/dashboard/remoteEntry.js"
        },
        {
            "id": "mfe-ordens",
            "route": "/ordens",
            "entry": "/mfes/ordens/remoteEntry.js"
        },
        {
            "id": "mfe-relatorios",
            "route": "/relatorios",
            "entry": "/mfes/relatorios/remoteEntry.js"
        }
    ]
}
```

### 11.2 Endpoints de Logout

- `POST /api/logout`
- `POST /api/logout/global`

### 11.3 Endpoints de Administracao de Acessos

- `GET /api/admin/role-access`
- `PUT /api/admin/role-access/:role`

### 11.4 Formato Padrao de Erro do BFF

```json
{
    "code": "SESSION_EXPIRED",
    "message": "Sessao expirada ou invalida.",
    "correlationId": "req-123"
}
```

Codigos minimos obrigatorios:

| HTTP | Code | Quando usar |
|---|---|---|
| 400 | `OIDC_CALLBACK_INVALID` | `state`, `nonce` ou callback invalido |
| 401 | `SESSION_NOT_FOUND` | Cookie sem sessao valida |
| 401 | `SESSION_EXPIRED` | Sessao expirada |
| 401 | `TOKEN_REFRESH_FAILED` | Falha definitiva de refresh |
| 403 | `FORBIDDEN` | Usuario autenticado sem permissao |
| 503 | `SESSION_STORE_UNAVAILABLE` | Redis indisponivel para autenticacao/sessao |
| 502 | `UPSTREAM_ERROR` | Falha de proxy para servico a jusante |

## 12. Requisitos de UX e Acessibilidade

### 12.1 UX

- Interface funcional, responsiva e adequada para demonstracao.
- Indicacao visual da role ou roles efetivas do usuario autenticado.
- Estados de carregamento durante bootstrap de sessao e redirecionamento OIDC.
- Mensagens distintas para sessao expirada, erro de autenticacao, acesso negado e indisponibilidade temporaria.
- A navegacao deve expor apenas modulos autorizados e ocultar MFEs nao permitidos.
- A tela administrativa deve permitir alterar acessos por role com feedback claro de persistencia e efeito esperado.

### 12.2 Acessibilidade

- Navegacao por teclado.
- Labels semanticos.
- Contraste compativel com WCAG 2.1 AA.

## 13. Restricoes Tecnicas

| Categoria | Restricao |
|---|---|
| IdP | CyberArk Identity ja configurado em ambiente de desenvolvimento |
| Runtime | Node.js 20+, Fastify, React + Vite + TypeScript com arquitetura de microfrontends, JDK 21+, Spring Boot 3+, .NET 8+ |
| Persistencia | Redis 7 standalone para PoC |
| Transporte | HTTP interno no cluster de desenvolvimento; TLS interno fora de escopo |
| Container | Dockerfiles multi-stage; imagens otimizadas quando possivel |
| Registry | `registry.tasso.dev.br` |
| Observabilidade | Logs estruturados JSON com identificador de correlacao |

## 14. Premissas Validadas e a Validar

### 14.1 Premissas Validadas

- Existe ambiente CyberArk de desenvolvimento disponivel.
- Existe cluster Kubernetes de desenvolvimento disponivel.
- A equipe possui acesso ao registry `registry.tasso.dev.br`.
- A equipe de infraestrutura possui Netscaler CPX para testes futuros.

### 14.2 Premissas que Exigem Confirmacao Antes da Implementacao Completa

- O access token emitido pelo CyberArk contem apenas claims necessarias para a PoC.
- A claim `ROLES` e entregue como array de strings no access token consumido pelos servicos.
- O emissor disponibiliza JWKS acessivel a Java e .NET no ambiente de desenvolvimento.
- A integracao disponivel permite comportamento compativel com refresh token rotation.
- O ambiente local de desenvolvimento suporta HTTPS ou estrategia equivalente necessaria para cookie `Secure` e redirecionamentos OIDC.
- A arquitetura escolhida para microfrontends suporta carregamento dinamico controlado pelo shell em tempo de execucao.

Nenhuma dessas premissas pode permanecer implicita durante a implementacao. Se qualquer uma falhar, o plano tecnico deve ser ajustado formalmente.

## 15. Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
|---|---|---|---|
| Redis indisponivel impede autenticacao e autorizacao | Alto | Media | Reinicio automatico em ambiente de desenvolvimento, tratamento explicito de erro e documentacao de dependencia critica |
| Refresh concorrente corrompe sessao | Alto | Media | Lock por sessao, atualizacao atomica e invalidez controlada do refresh token anterior |
| Divergencia entre frontend, BFF e microservicos na decisao de RBAC | Alto | Media | Matriz de permissao unica, contratos compartilhados e cenarios equivalentes de teste |
| Shell requisita microfrontend nao autorizado | Alto | Media | Catalogo de MFEs filtrado no BFF e validacao de rota/modulo no shell antes de qualquer carga remota |
| Access token emitido pelo IdP nao atende ao modelo thin JWT | Alto | Media | Validacao antecipada do token real antes da implementacao plena |
| Ambiente local inviabiliza cookies `Secure` e OIDC | Medio | Media | Documentar estrategia oficial de desenvolvimento local com HTTPS |
| Divergencia de validacao JWT entre Java e .NET | Medio | Baixa | Uso de bibliotecas padrao, issuer/audience unificados e validacao por JWKS |

## 16. Criterios de Aceite

Uma entrega so sera considerada concluida quando os criterios abaixo forem satisfeitos.

### 16.1 Autenticacao

- Login via CyberArk finaliza com cookie de sessao e sem exposicao de tokens ao navegador.
- Callback invalido gera `400 OIDC_CALLBACK_INVALID`.

### 16.2 Sessao e Renovacao

- Sessao invalida ou expirada gera `401` padronizado.
- Expiracao do access token aciona refresh transparente.
- Duas requisicoes concorrentes proximas da expiracao nao derrubam a sessao.

### 16.3 Logout

- `POST /api/logout` invalida apenas a sessao atual.
- `POST /api/logout/global` invalida todas as sessoes associadas ao usuario.

### 16.4 RBAC

- `admin`, `coordenador` e `tecnico` permanecem roles fixas do sistema.
- Alteracoes de acesso por role sao persistidas sem redeploy.
- Frontend e microservicos refletem a mesma permissao efetiva.

### 16.5 Microfrontends

- O shell nao carrega artefatos de MFEs nao autorizados para o usuario.
- A resposta de `GET /api/permissions` determina quais MFEs podem ser montados.
- A tela administrativa de acessos so e carregada para usuarios autorizados.

### 16.6 Infraestrutura

- Todos os servicos sobem via Docker Compose.
- Manifests Kubernetes de desenvolvimento existem para todos os componentes obrigatorios.
- Secrets e variaveis de ambiente necessarios estao documentados.

## 17. Entregaveis

- Frontend shell React.
- Microfrontends de dominio carregados dinamicamente.
- BFF Node.js/Fastify.
- Microservico Java.
- Microservico .NET.
- Redis configurado para sessao e permissoes.
- Dockerfiles.
- `docker-compose.yml`.
- Manifests Kubernetes.
- Documento de orientacao Netscaler.
- Documentacao operacional minima para execucao local.

## 18. Referencias

- OIDC Authorization Code Flow + PKCE: https://openid.net/specs/openid-connect-core-1_0.html
- BFF Pattern (Duende): https://docs.duendesoftware.com/identityserver/v7/bff/
- CyberArk Identity OIDC: https://docs.cyberark.com/identity
- Rascunho original: `docs/prd-draft.md`
