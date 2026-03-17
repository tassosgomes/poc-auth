package com.zcorp.ordersservice.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import com.zcorp.ordersservice.OrdersServiceProperties;

class JwtClaimsAdapterTest {

    private final JwtClaimsAdapter jwtClaimsAdapter = new JwtClaimsAdapter(new OrdersServiceProperties(
            new OrdersServiceProperties.Security("https://issuer.example.com", "https://issuer.example.com/jwks", "orders-service", "ROLES"),
            new OrdersServiceProperties.Authz("role_access:", java.time.Duration.ofSeconds(5)),
            "redis://localhost:6379"));

    @Test
    void extractRoles_WithMixedRoleValues_ShouldNormalizeAndFilterUnknownRoles() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("sub", "user-1")
                .claim("ROLES", List.of("ADMIN", "coordenador", "unknown", " tecnico "))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        assertThat(jwtClaimsAdapter.extractRoles(jwt))
                .containsExactlyInAnyOrder("admin", "coordenador", "tecnico");
    }

    @Test
    void extractRoles_WhenRolesClaimIsMissing_ShouldReturnEmptySet() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("sub", "user-1")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();

        assertThat(jwtClaimsAdapter.extractRoles(jwt)).isEmpty();
    }
}