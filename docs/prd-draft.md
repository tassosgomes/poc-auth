# PRD: Sistema de Identidade e Acesso (IAM) - ZCorp

## 1. Visão Geral

Implementar uma infraestrutura de autenticação e autorização moderna, baseada no padrão **BFF (Backend-for-Frontend)**, para garantir que tokens sensíveis nunca fiquem expostos no cliente (React) e que a autorização seja eficiente e escalável dentro do Kubernetes.

## 2. Objetivos Principais

* **Segurança Zero-Trust:** Eliminar a exposição de JWTs no navegador via Cookies `HttpOnly`.
* **Performance:** Evitar "tokens gigantes" (Fat Tokens) utilizando uma estratégia de Thin JWT + Cache de Permissões.
* **Escalabilidade:** Suportar múltiplas instâncias do BFF e microserviços via Redis e Kubernetes.
* **Interoperabilidade:** Integrar-se nativamente com CyberArk Identity, Sensedia e Netscaler.

---

## 3. Requisitos Funcionais (RF)

| ID | Requisito | Descrição |
| --- | --- | --- |
| **RF01** | **Autenticação OIDC** | O sistema deve delegar a autenticação para o CyberArk Identity via Authorization Code Flow + PKCE. |
| **RF02** | **Gestão de Sessão Stateful** | O BFF deve gerenciar a sessão do usuário, armazenando Access e Refresh Tokens no Redis. |
| **RF03** | **Autorização RBAC** | O sistema deve validar permissões baseadas em Roles (`admin`, `coordenador`, `tecnico`). |
| **RF04** | **Transparência para o Backend** | O BFF deve injetar o JWT no header `Authorization` para que os backends Java/.NET não precisem conhecer a sessão. |
| **RF05** | **Revogação de Acesso** | Permitir o encerramento imediato de sessões no Redis (Logoff Global). |

---

## 4. Requisitos Não-Funcionais (RNF)

* **Segurança:** Cookies devem ser configurados como `Secure`, `HttpOnly` e `SameSite=Strict`.
* **Latência:** A busca de tokens/permissões no Redis deve ocorrer em sub-milissegundos.
* **Resiliência:** O BFF deve lidar com falhas de conexão com o Redis e renovação automática de tokens (Silent Refresh).
* **Observabilidade:** Logs de auditoria de login/logout integrados à Elastic Stack da empresa.

---

## 5. Arquitetura Técnica Proposta

### Componentes:

1. **Frontend:** React (Vite + TypeScript).
2. **BFF:** Node.js (Fastify) atuando como Proxy e Gerenciador de Sessão.
3. **Data Store:** Redis para persistência de tokens e cache de permissões.
4. **Gateways:** * **Sensedia:** Validação de borda e controle de tráfego externo.
* **Netscaler Internal/CPX:** Roteamento interno e segurança Leste-Oeste.


5. **IdP:** CyberArk Identity.

### Fluxo de Autorização (O "Carinho" com o RBAC):

Para evitar o erro de tokens gigantes que você mencionou:

1. O JWT emitido pelo CyberArk conterá apenas o `user_id` e a `role`.
2. O BFF (ou o microserviço de destino) consultará o Redis para saber quais ações específicas aquela `role` pode executar.
3. O Frontend React consultará um endpoint do BFF (`/api/permissions`) para receber um JSON simples de configuração de menus, mantendo a lógica de UI separada do token.

---

## 6. Riscos e Mitigações

* **Risco:** Redis ficar indisponível, impedindo todos os acessos.
* **Mitigação:** Implementar Redis em modo Cluster/Sentinel dentro do Kubernetes.


* **Risco:** Latência adicional introduzida pelo "salto" no BFF.
* **Mitigação:** O Node.js/Fastify é assíncrono e extremamente eficiente para tarefas de I/O de rede (Proxy).