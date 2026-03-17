package com.zcorp.ordersservice.api.order;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zcorp.ordersservice.application.order.CreateOrderCommand;
import com.zcorp.ordersservice.application.order.CreateOrderUseCase;
import com.zcorp.ordersservice.application.order.ListOrdersUseCase;
import com.zcorp.ordersservice.domain.order.Order;
import com.zcorp.ordersservice.security.OrderPermissions;
import com.zcorp.ordersservice.security.PermissionEnforcementService;

import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/orders/v1/orders")
public class OrderController {

    private final ListOrdersUseCase listOrdersUseCase;
    private final CreateOrderUseCase createOrderUseCase;
    private final PermissionEnforcementService permissionEnforcementService;

    public OrderController(
            ListOrdersUseCase listOrdersUseCase,
            CreateOrderUseCase createOrderUseCase,
            PermissionEnforcementService permissionEnforcementService) {
        this.listOrdersUseCase = Objects.requireNonNull(listOrdersUseCase, "listOrdersUseCase must not be null");
        this.createOrderUseCase = Objects.requireNonNull(createOrderUseCase, "createOrderUseCase must not be null");
        this.permissionEnforcementService = Objects.requireNonNull(permissionEnforcementService, "permissionEnforcementService must not be null");
    }

    @GetMapping
    public List<OrderResponse> listOrders(Principal principal) {
        permissionEnforcementService.requirePermission(principal, OrderPermissions.VIEW, "orders");
        return listOrdersUseCase.execute().stream()
                .map(OrderResponse::from)
                .toList();
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request, Principal principal) {
        permissionEnforcementService.requirePermission(principal, OrderPermissions.CREATE, "orders");

        Order order = createOrderUseCase.execute(new CreateOrderCommand(request.customerName(), request.description()));
        OrderResponse response = OrderResponse.from(order);

        return ResponseEntity
                .created(URI.create("/orders/v1/orders/" + order.id()))
                .body(response);
    }
}