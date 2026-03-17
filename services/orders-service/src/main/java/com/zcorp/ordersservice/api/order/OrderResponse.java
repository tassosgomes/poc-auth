package com.zcorp.ordersservice.api.order;

import java.time.Instant;

import com.zcorp.ordersservice.domain.order.Order;
import com.zcorp.ordersservice.domain.order.OrderStatus;

public record OrderResponse(
        long id,
        String code,
        String customerName,
        String description,
        OrderStatus status,
        Instant createdAt) {

    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.id(),
                order.code(),
                order.customerName(),
                order.description(),
                order.status(),
                order.createdAt());
    }
}