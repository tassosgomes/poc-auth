package com.zcorp.ordersservice.domain.order;

import java.time.Instant;
import java.util.Objects;

public record Order(
        long id,
        String code,
        String customerName,
        String description,
        OrderStatus status,
        Instant createdAt) {

    public Order {
        Objects.requireNonNull(code, "code must not be null");
        Objects.requireNonNull(customerName, "customerName must not be null");
        Objects.requireNonNull(description, "description must not be null");
        Objects.requireNonNull(status, "status must not be null");
        Objects.requireNonNull(createdAt, "createdAt must not be null");

        if (code.isBlank()) {
            throw new IllegalArgumentException("code must not be blank");
        }

        if (customerName.isBlank()) {
            throw new IllegalArgumentException("customerName must not be blank");
        }

        if (description.isBlank()) {
            throw new IllegalArgumentException("description must not be blank");
        }
    }
}