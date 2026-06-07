package com.feasto.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.feasto.entity.DeliveryPartner;

@Repository
public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {
    List<DeliveryPartner> findByAvailableTrue();

    java.util.Optional<DeliveryPartner> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}