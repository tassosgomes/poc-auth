package com.zcorp.ordersservice.security;

import java.security.Principal;
import java.util.Objects;
import java.util.Set;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class PermissionEnforcementService {

    private final JwtClaimsAdapter jwtClaimsAdapter;
    private final PermissionResolver permissionResolver;

    public PermissionEnforcementService(JwtClaimsAdapter jwtClaimsAdapter, PermissionResolver permissionResolver) {
        this.jwtClaimsAdapter = Objects.requireNonNull(jwtClaimsAdapter, "jwtClaimsAdapter must not be null");
        this.permissionResolver = Objects.requireNonNull(permissionResolver, "permissionResolver must not be null");
    }

    public void requirePermission(Principal principal, String permission, String resource) {
        if (!(principal instanceof JwtAuthenticationToken jwtAuthenticationToken)) {
            throw new PermissionDeniedException(permission, resource, new PermissionDecision(false, Set.of(), Set.of(), "Authenticated principal is missing"));
        }

        Set<String> roles = jwtClaimsAdapter.extractRoles(jwtAuthenticationToken.getToken());
        PermissionDecision decision = permissionResolver.resolve(roles, permission, resource);
        if (!decision.allowed()) {
            throw new PermissionDeniedException(permission, resource, decision);
        }
    }
}