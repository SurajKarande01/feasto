package com.feasto.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.feasto.entity.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRestaurant_RestaurantId(Long restaurantId);

    List<Review> findByDeliveryPartner_DeliveryPartnerId(Long deliveryPartnerId);

    @Query("SELECT COUNT(r), COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.restaurant.restaurantId = :restaurantId")
    Object[] countAndAverageRatingByRestaurant(@Param("restaurantId") Long restaurantId);
}