# Implementacao IAM ZCorp PoC - Resumo de Tarefas

## Visao Geral

Este plano de execucao decompoe a PoC de IAM em tarefas principais independentes, mas tecnicamente coerentes, cobrindo autenticacao OIDC via BFF, sessao stateful, autorizacao dinamica por role, shell React com microfrontends autorizados, servicos Java e .NET com enforcement consistente, e entrega operacional com Traefik, Docker Compose e manifests Kubernetes. O sequenciamento preserva o caminho critico e elimina uma distribuicao rudimentar de trabalho que produziria integracoes incompativeis ou reescritas evitaveis.

## Fases de Implementacao

### Fase 1 - Fundacoes de Contrato e Controle de Acesso

Consolida contratos compartilhados, configuracao por ambiente, sessao OIDC no BFF e a fonte de verdade da matriz de acessos. Sem esta base, qualquer trabalho de UI ou microservico degeneraria em suposicoes locais e divergencia de comportamento.

### Fase 2 - Experiencia Protegida e Enforcement Distribuido

Entrega o shell React, o carregamento autorizado de microfrontends e o enforcement consistente nos servicos Java e .NET, todos guiados pelo mesmo modelo de permissao efetiva.

### Fase 3 - Endurecimento Operacional e Entrega de Plataforma

Fecha lacunas de refresh concorrente, logout global, observabilidade, conteinerizacao, borda TLS local, Kubernetes e documentacao operacional necessaria para demonstracao e evolucao segura.

## Tarefas

- [x] 1.0 Definir contratos compartilhados e baseline de ambiente
- [ ] 2.0 Implementar autenticacao OIDC e sessao stateful no BFF
- [ ] 3.0 Implementar matriz dinamica de acessos e administracao no BFF
- [ ] 4.0 Construir shell React com bootstrap de sessao e navegacao protegida
- [ ] 5.0 Entregar microfrontends remotos com carregamento autorizado
- [ ] 6.0 Implementar orders-service Java com JWT e autorizacao por permissao
- [ ] 7.0 Implementar reports-service .NET com JWT e autorizacao por permissao
- [ ] 8.0 Endurecer refresh, logout global, erros e observabilidade
- [ ] 9.0 Publicar stack operacional com Traefik, Compose, Kubernetes e guias

## Rastreabilidade US -> Tasks

| User Story | Tasks Relacionadas | Tipo de Cobertura |
|------------|--------------------|-------------------|
| HU01 | 2.0, 4.0, 9.0 | Direta |
| HU02 | 3.0, 4.0, 5.0, 6.0, 7.0 | Direta |
| HU03 | 2.0, 8.0 | Direta |
| HU04 | 3.0, 4.0, 5.0 | Direta |
| HU05 | 2.0, 6.0, 7.0, 8.0 | Direta |
| HU06 | 4.0, 5.0 | Direta |
| HU07 | 9.0 | Direta |
| HU08 | 9.0 | Direta |

## Analise de Paralelizacao

### Lanes de Execucao Paralela

| Lane | Tarefas | Descricao |
|------|---------|-----------|
| Lane A | 2.0, 3.0 | Evolucao do BFF apos contratos consolidados; sessao e autorizacao podem avancar em paralelo com interface de integracao definida |
| Lane B | 6.0, 7.0 | Implementacao dos servicos Java e .NET em paralelo, ambos dependentes da semantica de permissao estabilizada |
| Lane C | 5.0, 8.0 | Runtime de microfrontends e endurecimento operacional podem avancar em paralelo apos BFF e shell basicos estarem firmes |

### Caminho Critico

1.0 -> 2.0 -> 3.0 -> 4.0 -> 5.0 -> 8.0 -> 9.0

### Diagrama de Dependencias

```text
1.0
|- 2.0 -+- 4.0 - 5.0 - 9.0
|       |
|       +- 8.0 -+
|
|- 3.0 -+- 4.0
|       +- 6.0 -+
|       +- 7.0 -+-> 9.0
|       +- 8.0 -+
|
+-> 9.0
```