package com.zcorp.ordersservice.domain.order;

import java.util.List;

public interface OrderRepository {

    List<Order> findAll();

    Order save(Order order);
}