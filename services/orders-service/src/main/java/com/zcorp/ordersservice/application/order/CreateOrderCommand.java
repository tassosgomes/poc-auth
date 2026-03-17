package com.zcorp.ordersservice.application.order;

import java.util.Objects;

public record CreateOrderCommand(String customerName, String description) {

    public CreateOrderCommand {
        Objects.requireNonNull(customerName, "customerName must not be null");
        Objects.requireNonNull(description, "description must not be null");
    }
}