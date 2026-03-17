---
status: pending
parallelizable: false
blocked_by: ["1.0", "2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0"]
---

<task_context>
<domain>infra/platform/delivery</domain>
<type>documentation</type>
<scope>configuration</scope>
<complexity>high</complexity>
<dependencies>database,http_server,external_apis</dependencies>
<unblocks>"Nenhum"</unblocks>
</task_context>

# Tarefa 9.0: Publicar stack operacional com Traefik, Compose, Kubernetes e guias

## Relacionada as User Stories

- [HU01] Como usuario, quero autenticar via CyberArk Identity para acessar a aplicacao sem gerenciar credenciais localmente. (cobertura parcial)
- [HU07] Como desenvolvedor, quero executar a PoC localmente via Docker Compose e implantar em Kubernetes com manifests basicos. (cobertura direta)
- [HU08] Como engenheiro de infraestrutura, quero um guia de orientacao para Netscaler compativel com esta arquitetura. (cobertura direta)

## Visao Geral

Materializar a plataforma de execucao da PoC: Dockerfiles multi-stage, `docker-compose` com Traefik na borda TLS, manifests Kubernetes minimos, configuracoes de probes/recursos e documentacao operacional, incluindo orientacao para Netscaler CPX. Sem essa entrega, a solucao permanece conceitual e operacionalmente incompleta.

## Requisitos

- Criar Dockerfiles multi-stage para shell, remotes, BFF, Java e .NET.
- Publicar `docker-compose.yml` com Traefik, Redis, banco, BFF, shell, remotes e microservicos.
- Configurar hostnames oficiais `*.tasso.dev.br` e roteamento TLS local pela borda Traefik.
- Publicar manifests Kubernetes minimos com Deployment, Service, ConfigMap e Secret quando aplicavel.
- Documentar execucao local, variaveis necessarias, estrategia TLS/certificados e guia de orientacao para Netscaler.

## Subtarefas

- [ ] 9.1 Criar Dockerfiles multi-stage non-root para todos os componentes obrigatorios.
- [ ] 9.2 Montar `docker-compose.yml` com Traefik, labels de roteamento, Redis, banco e servicos da PoC.
- [ ] 9.3 Configurar manifests Kubernetes minimos com probes, requests, limits e configuracao por ambiente.
- [ ] 9.4 Documentar DNS local, certificados, hostnames oficiais e fluxo OIDC em ambiente de desenvolvimento.
- [ ] 9.5 Produzir guia de orientacao Netscaler CPX aderente a arquitetura BFF e a fronteira de confianca da PoC.
- [ ] 9.6 Executar validacao integrada da stack e registrar evidencias operacionais e lacunas residuais.

## Sequenciamento

- Bloqueado por: 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0
- Desbloqueia: Nenhum
- Paralelizavel: Nao (consolida a entrega integrada e depende da maturidade funcional dos componentes anteriores)

## Rastreabilidade

- Esta tarefa cobre: HU01, HU07, HU08
- Evidencia esperada: `docker-compose.yml`, Dockerfiles, manifests Kubernetes, README/guia operacional, documento Netscaler e validacao de subida da stack.

## Detalhes de Implementacao

- Traefik deve ser o unico componente publicado nas portas `80` e `443`.
- O cookie de sessao deve permanecer `Secure=true` no ambiente local, eliminando a concessao tecnicamente inferior de `Secure=false`.
- Documentar os hostnames `app-authpoc.tasso.dev.br` e `api-authpoc.tasso.dev.br` como minimo aceitavel do fluxo.

## Criterios de Sucesso

- A stack sobe localmente por Compose com borda TLS e fluxo realista de cookie/OIDC.
- Todos os componentes obrigatorios possuem manifests Kubernetes minimos de desenvolvimento.
- A documentacao operacional e de infraestrutura e suficiente para reproducao e avaliacao tecnica da PoC.