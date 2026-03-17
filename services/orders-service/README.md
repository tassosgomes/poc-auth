# orders-service

Spring Boot 3 / Java 21 microservice for the IAM ZCorp PoC.

## Responsibilities

- Validate JWT locally through JWKS, issuer, audience and claim format validation.
- Normalize `ROLES` claim values to the fixed lower-case role contract.
- Resolve effective permissions from Redis-backed `role_access:<role>` entries populated by the BFF.
- Expose protected order endpoints:
  - `GET /orders/v1/orders`
  - `POST /orders/v1/orders`

## Environment

- `ORDERS_SERVICE_PORT=8080`
- `ORDERS_SERVICE_SECURITY_ISSUER_URI=https://issuer.example.com`
- `ORDERS_SERVICE_SECURITY_JWK_SET_URI=https://issuer.example.com/oauth2/jwks`
- `ORDERS_SERVICE_SECURITY_AUDIENCE=orders-service`
- `ORDERS_SERVICE_SECURITY_ROLES_CLAIM=ROLES`
- `ORDERS_SERVICE_AUTHZ_ROLE_ACCESS_KEY_PREFIX=role_access:`
- `ORDERS_SERVICE_AUTHZ_LOCAL_CACHE_TTL=PT5S`
- `ORDERS_SERVICE_REDIS_URL=redis://redis:6379`

## Local commands

```bash
mvn spring-boot:run
mvn test
```

## Authorization model

- `GET /orders/v1/orders` requires `ordens:view`
- `POST /orders/v1/orders` requires `ordens:create`

The service never trusts role names alone for access decisions. Roles are only used as input to resolve the effective permission union.