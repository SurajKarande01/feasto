package com.feasto.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.feasto.enums.Role;

import jakarta.persistence.Cacheable;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor

@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "delivery_partners", indexes = {
        @Index(name = "idx_delivery_partners_email", columnList = "email"),
        @Index(name = "idx_delivery_partners_available", columnList = "available")
})
public class DeliveryPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long deliveryPartnerId;

    private String name;

    private String phoneNumber;

    @Column(unique = true)
    private String email;

    private String password; // BCrypt-hashed on registration

    private String vehicleDetails; // Optional

    private String vehicleType; // e.g. Bicycle, Motorcycle, Car, Scooter

    @Enumerated(EnumType.STRING)
    private Role role;

    private Boolean available;

    @Embedded
    private Location currentLocation; // Embedded with lat/long

    private Double averageRating;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "deliveryPartner", cascade = CascadeType.ALL)
    private List<Order> orders = new ArrayList<>();

}