package com.zcorp.ordersservice.api.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(
        @NotBlank(message = "customerName is required")
        @Size(max = 120, message = "customerName must have at most 120 characters")
        String customerName,
        @NotBlank(message = "description is required")
        @Size(max = 500, message = "description must have at most 500 characters")
        String description) {
}