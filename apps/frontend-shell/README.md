# Frontend Shell - IAM ZCorp

Shell React responsavel por bootstrap de sessao, navegacao protegida e composicao dinamica a partir de `GET /api/permissions`.

## Comandos

- `npm install`
- `npm run dev`
- `npm run build`
- `npm test`

## Variaveis de ambiente

- `VITE_BFF_BASE_URL`: base publica do BFF. Default: `https://api-authpoc.tasso.dev.br`
- `VITE_ENABLE_CORRELATION`: quando `true`, envia `x-correlation-id` em requests do shell

## Escopo atual

- bootstrap de sessao com cookie HttpOnly
- tratamento centralizado de `401`, `403` e indisponibilidade temporaria
- menu e rotas derivados do `PermissionSnapshot`
- carregamento de MFEs via Module Federation somente apos validar o catalogo autorizado
- bloqueio de import dinamico para rotas ausentes do snapshot do BFF
- remoto administrativo integrado a `GET/PUT /api/admin/role-access`