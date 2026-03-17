package com.zcorp.ordersservice.security;

import java.util.Set;

public interface PermissionResolver {

    PermissionDecision resolve(Set<String> roles, String permission, String resource);
}