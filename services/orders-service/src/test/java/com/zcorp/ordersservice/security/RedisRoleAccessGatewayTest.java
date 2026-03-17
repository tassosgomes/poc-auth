package com.zcorp.ordersservice.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zcorp.ordersservice.OrdersServiceProperties;

class RedisRoleAccessGatewayTest {

    @Test
    void getRoleAccess_WhenCachedLocally_ShouldAvoidRepeatedRedisLookups() {
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("role_access:admin")).thenReturn("""
                {
                  "role": "admin",
                  "permissions": ["ordens:view", "ordens:create"],
                  "version": 4
                }
                """);

        RedisRoleAccessGateway gateway = new RedisRoleAccessGateway(
                redisTemplate,
                new ObjectMapper(),
                new OrdersServiceProperties(
                        new OrdersServiceProperties.Security("https://issuer.example.com", "https://issuer.example.com/jwks", "orders-service", "ROLES"),
                        new OrdersServiceProperties.Authz("role_access:", Duration.ofSeconds(5)),
                        "redis://localhost:6379"));

        Optional<RoleAccessRecord> firstLookup = gateway.getRoleAccess("admin");
        Optional<RoleAccessRecord> secondLookup = gateway.getRoleAccess("admin");

        assertThat(firstLookup).isPresent();
        assertThat(secondLookup).isPresent();
        assertThat(firstLookup.orElseThrow().permissions()).containsExactlyInAnyOrder("ordens:view", "ordens:create");
        verify(valueOperations, times(1)).get("role_access:admin");
    }
}