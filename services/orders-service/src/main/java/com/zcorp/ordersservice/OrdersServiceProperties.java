package com.zcorp.ordersservice;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "orders-service")
public record OrdersServiceProperties(
        Security security,
        Authz authz,
        @DefaultValue("redis://localhost:6379") String redisUrl) {

    public record Security(
            String issuerUri,
            String jwkSetUri,
            String audience,
            @DefaultValue("ROLES") String rolesClaim) {
    }

    public record Authz(
            @DefaultValue("role_access:") String roleAccessKeyPrefix,
            @DefaultValue("PT5S") Duration localCacheTtl) {
    }
}