package com.feasto.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.feasto.entity.Restaurant;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long>, RestaurantRepositoryCustom {

        // Simple case-insensitive contains search for active restaurants
        Page<Restaurant> findByNameContainingIgnoreCaseAndIsActiveTrue(
                        String name, Pageable pageable);

        List<Restaurant> findByIsActiveTrue();

        Optional<Restaurant> findByEmail(String email);

        boolean existsByEmailIgnoreCase(String email);

       Page<Restaurant> findByAddress_CityIgnoreCaseAndIsActiveTrue(
                        String city, org.springframework.data.domain.Pageable pageable);
}