package com.zcorp.ordersservice.security;

import java.util.Objects;

public class PermissionDeniedException extends RuntimeException {

    private final String permission;
    private final String resource;
    private final PermissionDecision decision;

    public PermissionDeniedException(String permission, String resource, PermissionDecision decision) {
        super(decision.reason());
        this.permission = Objects.requireNonNull(permission, "permission must not be null");
        this.resource = Objects.requireNonNull(resource, "resource must not be null");
        this.decision = Objects.requireNonNull(decision, "decision must not be null");
    }

    public String getPermission() {
        return permission;
    }

    public String getResource() {
        return resource;
    }

    public PermissionDecision getDecision() {
        return decision;
    }
}