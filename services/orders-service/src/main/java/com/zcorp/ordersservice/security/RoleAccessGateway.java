package com.zcorp.ordersservice.security;

import java.util.Optional;

public interface RoleAccessGateway {

    Optional<RoleAccessRecord> getRoleAccess(String role);
}