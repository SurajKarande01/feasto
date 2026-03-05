// src/main/java/com/tka/feasto/repository/MenuItemRepository.java
package com.feasto.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.feasto.entity.MenuItem;

import jakarta.persistence.QueryHint;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    @Query("SELECT m FROM MenuItem m WHERE m.restaurant.restaurantId = :restaurantId")
    @QueryHints({ @QueryHint(name = "org.hibernate.cacheable", value = "true") })
    List<MenuItem> findByRestaurant_RestaurantId(@Param("restaurantId") Long restaurantId);

}