package com.feasto.dto;

import java.time.LocalDateTime;

import com.feasto.entity.Location;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPartnerDTO {

    private Long deliveryPartnerId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    private com.feasto.enums.Role role;
    private String vehicleDetails;
    private String vehicleType;
    private Boolean available;
    private Location currentLocation;
    private Double rating; // Average rating from customers
    private Integer ordersCompleted; // Total number of completed deliveries
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
}