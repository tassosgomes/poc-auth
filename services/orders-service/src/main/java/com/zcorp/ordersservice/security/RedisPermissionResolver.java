package com.zcorp.ordersservice.security;

import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

import org.springframework.stereotype.Component;

@Component
public class RedisPermissionResolver implements PermissionResolver {

    private final RoleAccessGateway roleAccessGateway;

    public RedisPermissionResolver(RoleAccessGateway roleAccessGateway) {
        this.roleAccessGateway = Objects.requireNonNull(roleAccessGateway, "roleAccessGateway must not be null");
    }

    @Override
    public PermissionDecision resolve(Set<String> roles, String permission, String resource) {
        Objects.requireNonNull(roles, "roles must not be null");
        Objects.requireNonNull(permission, "permission must not be null");
        Objects.requireNonNull(resource, "resource must not be null");

        if (roles.isEmpty()) {
            return new PermissionDecision(false, Set.of(), Set.of(), "Authenticated token does not contain a valid role");
        }

        Set<String> matchedRoles = new LinkedHashSet<>();
        Set<String> matchedPermissions = new LinkedHashSet<>();

        for (String role : roles) {
            roleAccessGateway.getRoleAccess(role)
                    .ifPresent(record -> {
                        if (record.permissions().contains(permission)) {
                            matchedRoles.add(record.role());
                            matchedPermissions.add(permission);
                        }
                    });
        }

        if (matchedPermissions.contains(permission)) {
            return new PermissionDecision(true, Set.copyOf(matchedRoles), Set.copyOf(matchedPermissions), "Permission granted by effective role access");
        }

        return new PermissionDecision(false, Set.copyOf(matchedRoles), Set.of(), "Effective permission not granted for resource " + resource);
    }
}