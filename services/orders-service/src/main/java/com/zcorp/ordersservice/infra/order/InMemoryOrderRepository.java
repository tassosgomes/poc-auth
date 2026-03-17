package com.zcorp.ordersservice.infra.order;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Repository;

import com.zcorp.ordersservice.domain.order.Order;
import com.zcorp.ordersservice.domain.order.OrderRepository;
import com.zcorp.ordersservice.domain.order.OrderStatus;

@Repository
public class InMemoryOrderRepository implements OrderRepository {

    private final AtomicLong sequence = new AtomicLong(2000);
    private final CopyOnWriteArrayList<Order> orders = new CopyOnWriteArrayList<>(List.of(
            new Order(1001L, "OS-100001", "Alice Souza", "Install a new fiber modem", OrderStatus.CREATED, Instant.parse("2026-03-17T10:00:00Z")),
            new Order(1002L, "OS-100002", "Bruno Lima", "Replace damaged router", OrderStatus.IN_PROGRESS, Instant.parse("2026-03-17T10:15:00Z")),
            new Order(1003L, "OS-100003", "Carla Nunes", "Validate field connectivity", OrderStatus.COMPLETED, Instant.parse("2026-03-17T10:30:00Z"))));

    @Override
    public List<Order> findAll() {
        return new ArrayList<>(orders);
    }

    @Override
    public Order save(Order order) {
        Objects.requireNonNull(order, "order must not be null");

        Order persisted = new Order(
                sequence.incrementAndGet(),
                order.code(),
                order.customerName(),
                order.description(),
                order.status(),
                order.createdAt());

        orders.add(persisted);
        return persisted;
    }
}