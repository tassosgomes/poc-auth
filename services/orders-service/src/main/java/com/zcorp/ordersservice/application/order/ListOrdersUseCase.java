package com.zcorp.ordersservice.application.order;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zcorp.ordersservice.domain.order.Order;
import com.zcorp.ordersservice.domain.order.OrderRepository;

@Service
@Transactional(readOnly = true)
public class ListOrdersUseCase {

    private final OrderRepository orderRepository;

    public ListOrdersUseCase(OrderRepository orderRepository) {
        this.orderRepository = Objects.requireNonNull(orderRepository, "orderRepository must not be null");
    }

    public List<Order> execute() {
        return orderRepository.findAll();
    }
}