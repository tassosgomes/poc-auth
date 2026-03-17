# ADR-001: Redis como cache operacional e banco relacional como fonte de verdade de role_access

- Status: Aceita
- Data: 2026-03-17
- Contexto: PoC IAM ZCorp

## Contexto

A PoC exige configuração dinâmica de acessos por role com rastreabilidade mínima, consistência de leitura e invalidação de cache determinística. Também exige sessão stateful e alta performance para leitura operacional.

## Decisão

- Redis será usado para:
  - armazenamento de sessão
  - locks de refresh
  - cache operacional de snapshots de permissão e role_access
- Banco relacional do BFF será usado para:
  - fonte de verdade da matriz role_access
  - versionamento
  - persistência durável e auditoria mínima

## Justificativa

- Redis isolado não oferece governança de configuração durável adequada para role_access.
- Banco relacional reduz risco de perda de configuração e suporta histórico mínimo de alterações.
- Redis mantém latência baixa para fluxos críticos de sessão e bootstrap de autorização.
- Estratégia por versionamento evita invalidação cega e leituras obsoletas.

## Consequências

Positivas:

- consistência de autorização entre BFF, Java e .NET
- melhor rastreabilidade de mudanças administrativas
- desempenho operacional compatível com meta p95 de leitura em cache

Negativas:

- maior complexidade operacional por coexistência de banco + cache
- necessidade de disciplina de invalidação/versionamento

## Alternativas Consideradas

- Redis como única fonte de verdade para role_access: rejeitada por fragilidade de governança e durabilidade.
- Banco relacional sem cache Redis para snapshots: rejeitada por pior latência para consulta de permissões em rotas frequentes.
