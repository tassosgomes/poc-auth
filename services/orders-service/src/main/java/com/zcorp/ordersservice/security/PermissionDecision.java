package com.zcorp.ordersservice.security;

import java.util.Set;

public record PermissionDecision(
        boolean allowed,
        Set<String> matchedRoles,
        Set<String> matchedPermissions,
        String reason) {
}