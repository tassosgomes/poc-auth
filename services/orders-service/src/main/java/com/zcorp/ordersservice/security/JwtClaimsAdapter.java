package com.zcorp.ordersservice.security;

import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.zcorp.ordersservice.OrdersServiceProperties;

@Component
public class JwtClaimsAdapter {

    private static final Set<String> FIXED_ROLES = Set.of("admin", "coordenador", "tecnico");

    private final OrdersServiceProperties properties;

    public JwtClaimsAdapter(OrdersServiceProperties properties) {
        this.properties = Objects.requireNonNull(properties, "properties must not be null");
    }

    public Set<String> extractRoles(Jwt jwt) {
        Objects.requireNonNull(jwt, "jwt must not be null");

        Object source = jwt.getClaims().get(properties.security().rolesClaim());
        if (source == null) {
            source = jwt.getClaims().get("roles");
        }

        if (!(source instanceof Iterable<?> iterable)) {
            return Set.of();
        }

        Set<String> normalized = new LinkedHashSet<>();
        for (Object roleValue : iterable) {
            if (!(roleValue instanceof String role)) {
                continue;
            }

            String normalizedRole = role.trim().toLowerCase();
            if (FIXED_ROLES.contains(normalizedRole)) {
                normalized.add(normalizedRole);
            }
        }

        return Set.copyOf(normalized);
    }
}