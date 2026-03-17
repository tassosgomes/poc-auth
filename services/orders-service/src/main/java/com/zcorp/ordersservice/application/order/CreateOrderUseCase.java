package com.zcorp.ordersservice.application.order;

import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zcorp.ordersservice.domain.order.Order;
import com.zcorp.ordersservice.domain.order.OrderRepository;
import com.zcorp.ordersservice.domain.order.OrderStatus;

@Service
@Transactional
public class CreateOrderUseCase {

    private final OrderRepository orderRepository;

    public CreateOrderUseCase(OrderRepository orderRepository) {
        this.orderRepository = Objects.requireNonNull(orderRepository, "orderRepository must not be null");
    }

    public Order execute(CreateOrderCommand command) {
        Objects.requireNonNull(command, "command must not be null");

        Order order = new Order(
                0L,
                generateCode(),
                command.customerName().trim(),
                command.description().trim(),
                OrderStatus.CREATED,
                Instant.now());

        return orderRepository.save(order);
    }

    private String generateCode() {
        return "OS-" + ThreadLocalRandom.current().nextInt(100000, 999999);
    }
}