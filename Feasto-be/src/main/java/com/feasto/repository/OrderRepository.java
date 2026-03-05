// src/main/java/com/tka/feasto/repository/OrderRepository.java
package com.feasto.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.feasto.entity.Order;
import com.feasto.enums.OrderStatus;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser_UserId(Long userId);

    List<Order> findByRestaurant_RestaurantId(Long restaurantId);
    
    Page<Order> findByRestaurant_RestaurantId(Long restaurantId, Pageable pageable);

    Page<Order> findByRestaurant_RestaurantIdAndOrderStatus(Long restaurantId, OrderStatus orderStatus, Pageable pageable);

    List<Order> findByDeliveryPartner_DeliveryPartnerId(Long deliveryPartnerId);

    // Aggregations pushed to DB for better performance
    long countByRestaurant_RestaurantId(Long restaurantId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.restaurant.restaurantId = :restaurantId")
    Double sumTotalAmountByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT o.orderStatus, COUNT(o) FROM Order o WHERE o.restaurant.restaurantId = :restaurantId GROUP BY o.orderStatus")
    List<Object[]> countOrdersByStatusForRestaurant(@Param("restaurantId") Long restaurantId);

    // top menu items aggregated from OrderItem (quantity and revenue) for the
    // restaurant
    @Query("SELECT oi.menuItem.menuItemId, oi.menuItem.name, COALESCE(SUM(oi.quantity),0), COALESCE(SUM(oi.quantity * oi.price),0) "
            + "FROM OrderItem oi WHERE oi.order.restaurant.restaurantId = :restaurantId "
            + "GROUP BY oi.menuItem.menuItemId, oi.menuItem.name "
            + "ORDER BY COALESCE(SUM(oi.quantity),0) DESC")
    List<Object[]> findTopMenuItemsByRestaurant(@Param("restaurantId") Long restaurantId, Pageable pageable);
}