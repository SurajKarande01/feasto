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

@Service
public class DeliveryPartnerService {

    @Autowired
    private DeliveryPartnerRepository deliveryPartnerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private CustomMapper mapper;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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
        partner.setPassword(passwordEncoder.encode(partner.getPassword()));
        DeliveryPartner saved = deliveryPartnerRepository.save(partner);
        return mapper.toDeliveryPartnerDTO(saved);
    }

    @Cacheable(value = "deliveryPartnerById", key = "#id")
    public DeliveryPartnerDTO getDeliveryPartnerById(Long id) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery Partner not found with id: " + id));
        return mapper.toDeliveryPartnerDTO(partner);
    }

    @Cacheable(value = "deliveryPartnersAll")
    public List<DeliveryPartnerDTO> getAllDeliveryPartners() {
        return deliveryPartnerRepository.findAll().stream()
                .map(mapper::toDeliveryPartnerDTO)
                .collect(Collectors.toList());
    }

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

    public List<DeliveryPartnerDTO> getAvailableDeliveryPartners() {
        return deliveryPartnerRepository.findByAvailableTrue().stream()
                .map(mapper::toDeliveryPartnerDTO)
                .collect(Collectors.toList());
    }

    public DeliveryPartnerDTO loginDeliveryPartner(String email, String password) {
        DeliveryPartner partner = deliveryPartnerRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        // Password is already verified by AuthenticationManager; just return the profile.
        return mapper.toDeliveryPartnerDTO(partner);
    }
}