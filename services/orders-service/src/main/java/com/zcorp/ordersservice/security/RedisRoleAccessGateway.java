package com.zcorp.ordersservice.security;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.zcorp.ordersservice.OrdersServiceProperties;

@Component
public class RedisRoleAccessGateway implements RoleAccessGateway {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final String roleAccessKeyPrefix;
    private final Cache<String, Optional<RoleAccessRecord>> localCache;

    public RedisRoleAccessGateway(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            OrdersServiceProperties properties) {
        this.redisTemplate = Objects.requireNonNull(redisTemplate, "redisTemplate must not be null");
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
        Objects.requireNonNull(properties, "properties must not be null");
        this.roleAccessKeyPrefix = properties.authz().roleAccessKeyPrefix();
        Duration localCacheTtl = properties.authz().localCacheTtl();
        this.localCache = Caffeine.newBuilder()
                .expireAfterWrite(localCacheTtl)
                .maximumSize(64)
                .build();
    }

    @Override
    public Optional<RoleAccessRecord> getRoleAccess(String role) {
        Objects.requireNonNull(role, "role must not be null");
        return localCache.get(role, this::readRoleAccess);
    }

    private Optional<RoleAccessRecord> readRoleAccess(String role) {
        try {
            String rawValue = redisTemplate.opsForValue().get(roleAccessKeyPrefix + role);
            if (rawValue == null || rawValue.isBlank()) {
                return Optional.empty();
            }

            StoredRoleAccessPayload payload = objectMapper.readValue(rawValue, StoredRoleAccessPayload.class);
            return Optional.of(new RoleAccessRecord(
                    payload.role(),
                    Set.copyOf(Optional.ofNullable(payload.permissions()).orElse(List.of())),
                    payload.version()));
        } catch (PermissionMatrixUnavailableException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new PermissionMatrixUnavailableException("Role access lookup failed", exception);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record StoredRoleAccessPayload(String role, List<String> permissions, int version) {
    }
}