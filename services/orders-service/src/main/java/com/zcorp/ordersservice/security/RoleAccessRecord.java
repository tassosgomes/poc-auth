package com.zcorp.ordersservice.security;

import java.util.Set;

public record RoleAccessRecord(String role, Set<String> permissions, int version) {
}