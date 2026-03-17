package com.zcorp.ordersservice.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;

class RedisPermissionResolverTest {

    @Test
    void resolve_WhenAnyRoleGrantsPermission_ShouldAllowAccess() {
        RoleAccessGateway roleAccessGateway = mock(RoleAccessGateway.class);
        when(roleAccessGateway.getRoleAccess("tecnico"))
                .thenReturn(Optional.of(new RoleAccessRecord("tecnico", Set.of("ordens:view"), 3)));
        when(roleAccessGateway.getRoleAccess("coordenador"))
                .thenReturn(Optional.of(new RoleAccessRecord("coordenador", Set.of("ordens:view", "ordens:create"), 5)));

        RedisPermissionResolver resolver = new RedisPermissionResolver(roleAccessGateway);
        PermissionDecision decision = resolver.resolve(Set.of("tecnico", "coordenador"), "ordens:create", "orders");

        assertThat(decision.allowed()).isTrue();
        assertThat(decision.matchedRoles()).containsExactly("coordenador");
        assertThat(decision.matchedPermissions()).containsExactly("ordens:create");
    }

    @Test
    void resolve_WhenNoRoleGrantsPermission_ShouldDenyAccess() {
        RoleAccessGateway roleAccessGateway = mock(RoleAccessGateway.class);
        when(roleAccessGateway.getRoleAccess("tecnico"))
                .thenReturn(Optional.of(new RoleAccessRecord("tecnico", Set.of("ordens:view"), 3)));

        RedisPermissionResolver resolver = new RedisPermissionResolver(roleAccessGateway);
        PermissionDecision decision = resolver.resolve(Set.of("tecnico"), "ordens:create", "orders");

        assertThat(decision.allowed()).isFalse();
        assertThat(decision.matchedPermissions()).isEmpty();
    }
}