package com.feasto.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.feasto.dto.DeliveryPartnerDTO;
import com.feasto.entity.DeliveryPartner;
import com.feasto.entity.Location;
import com.feasto.enums.Role;
import com.feasto.exception.ResourceNotFoundException;
import com.feasto.exception.UnauthorizedException;
import com.feasto.exception.ValidationException;
import com.feasto.mapper.CustomMapper;
import com.feasto.repository.DeliveryPartnerRepository;
import com.feasto.repository.UserRepository;
import com.feasto.repository.RestaurantRepository;
import com.feasto.repository.OrderRepository;
import com.feasto.repository.ReviewRepository;
import com.feasto.entity.Order;
import com.feasto.entity.Review;

@Service
public class DeliveryPartnerService {

    @Autowired
    private DeliveryPartnerRepository deliveryPartnerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private CustomMapper mapper;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    /**
     * Registers a new delivery rider in the platform.
     * It validates that their email is unique, sets their default role, hashes their password,
     * and initializes their default availability status.
     */
    @Caching(evict = { @CacheEvict(value = "deliveryPartnersAll", allEntries = true),
            @CacheEvict(value = "deliveryPartnersAvailable", allEntries = true) })
    public DeliveryPartnerDTO registerDeliveryPartner(DeliveryPartnerDTO dto) {
        String email = dto.getEmail();
        if (userRepository.existsByEmailIgnoreCase(email) || 
            restaurantRepository.existsByEmailIgnoreCase(email) || 
            deliveryPartnerRepository.existsByEmailIgnoreCase(email)) {
            throw new ValidationException("Email already registered");
        }
        DeliveryPartner partner = mapper.toDeliveryPartner(dto);
        if (partner.getRole() == null) {
            partner.setRole(Role.DELIVERY_PARTNER);
        }
        if (partner.getAvailable() == null) {
            partner.setAvailable(false);
        }
        partner.setPassword(passwordEncoder.encode(partner.getPassword()));
        DeliveryPartner saved = deliveryPartnerRepository.save(partner);
        return mapper.toDeliveryPartnerDTO(saved);
    }

    /**
     * Finds a single delivery partner by their database ID, with caching support.
     */
    @Cacheable(value = "deliveryPartnerById", key = "#id")
    public DeliveryPartnerDTO getDeliveryPartnerById(Long id) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery Partner not found with id: " + id));
        return mapper.toDeliveryPartnerDTO(partner);
    }

    /**
     * Returns a list of all delivery partners registered on the platform.
     */
    @Cacheable(value = "deliveryPartnersAll")
    public List<DeliveryPartnerDTO> getAllDeliveryPartners() {
        return deliveryPartnerRepository.findAll().stream()
                .map(mapper::toDeliveryPartnerDTO)
                .collect(Collectors.toList());
    }

    /**
     * Updates whether a rider is online and ready for deliveries,
     * and saves their current geographical coordinates.
     */
    @Caching(evict = { @CacheEvict(value = "deliveryPartnersAll", allEntries = true),
            @CacheEvict(value = "deliveryPartnersAvailable", allEntries = true),
            @CacheEvict(value = "deliveryPartnerById", key = "#id") })
    public DeliveryPartnerDTO updateAvailability(Long id, boolean isAvailable, Location currentLocation) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery Partner not found with id: " + id));
        partner.setAvailable(isAvailable);
        if (currentLocation != null) {
            partner.setCurrentLocation(currentLocation);
        }
        DeliveryPartner updated = deliveryPartnerRepository.save(partner);
        return mapper.toDeliveryPartnerDTO(updated);
    }

    /**
     * Updates the delivery partner's profile information (name, vehicle details, or password).
     */
    @Caching(evict = { @CacheEvict(value = "deliveryPartnersAll", allEntries = true),
            @CacheEvict(value = "deliveryPartnersAvailable", allEntries = true),
            @CacheEvict(value = "deliveryPartnerById", key = "#id") })
    public DeliveryPartnerDTO updateDeliveryPartner(Long id, DeliveryPartnerDTO dto) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery Partner not found with id: " + id));
        if (dto.getName() != null) partner.setName(dto.getName());
        if (dto.getPhoneNumber() != null) partner.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getVehicleDetails() != null) partner.setVehicleDetails(dto.getVehicleDetails());
        if (dto.getVehicleType() != null) partner.setVehicleType(dto.getVehicleType());
        if (dto.getCurrentLocation() != null) partner.setCurrentLocation(dto.getCurrentLocation());
        if (dto.getAvailable() != null) partner.setAvailable(dto.getAvailable());
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            partner.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        DeliveryPartner updated = deliveryPartnerRepository.save(partner);
        return mapper.toDeliveryPartnerDTO(updated);
    }

    /**
     * Retrieves all riders who are currently online and available.
     */
    public List<DeliveryPartnerDTO> getAvailableDeliveryPartners() {
        return deliveryPartnerRepository.findByAvailableTrue().stream()
                .map(mapper::toDeliveryPartnerDTO)
                .collect(Collectors.toList());
    }

    /**
     * Authenticates a delivery partner and returns their profile details.
     */
    public DeliveryPartnerDTO loginDeliveryPartner(String email, String password) {
        DeliveryPartner partner = deliveryPartnerRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        // Password is already verified by AuthenticationManager; just return the profile.
        return mapper.toDeliveryPartnerDTO(partner);
    }

    /**
     * Deletes a delivery partner from the system, removes references in assigned orders,
     * and deletes their associated reviews.
     */
    @Caching(evict = { @CacheEvict(value = "deliveryPartnersAll", allEntries = true),
            @CacheEvict(value = "deliveryPartnersAvailable", allEntries = true),
            @CacheEvict(value = "deliveryPartnerById", key = "#id") })
    public void deleteDeliveryPartner(Long id) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery Partner not found with id: " + id));

        // Unlink orders
        List<Order> deliveries = orderRepository.findByDeliveryPartner_DeliveryPartnerId(id);
        for (Order o : deliveries) {
            o.setDeliveryPartner(null);
        }
        orderRepository.saveAll(deliveries);

        // Delete reviews
        List<Review> reviews = reviewRepository.findByDeliveryPartner_DeliveryPartnerId(id);
        reviewRepository.deleteAll(reviews);

        deliveryPartnerRepository.delete(partner);
    }
}