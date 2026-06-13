package com.feasto.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feasto.dto.DeliveryPartnerAvailabilityDTO;
import com.feasto.dto.DeliveryPartnerDTO;
import com.feasto.dto.LocationUpdateDTO;
import com.feasto.dto.LoginDTO;
import com.feasto.dto.OrderDTO;
import com.feasto.entity.Location;
import com.feasto.mapper.CustomMapper;
import com.feasto.service.DeliveryPartnerService;
import com.feasto.service.OrderService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/delivery-partners")
public class DeliveryPartnerController {

	@Autowired
	private DeliveryPartnerService deliveryPartnerService;

	@Autowired
	private OrderService orderService;

	@Autowired
	private SimpMessagingTemplate messagingTemplate;

	@Autowired
	private CustomMapper mapper;

    @Autowired
    private org.springframework.security.authentication.AuthenticationManager authenticationManager;

    @Autowired
    private com.feasto.util.JwtUtils jwtUtils;

	@PostMapping("/register")
	public ResponseEntity<DeliveryPartnerDTO> registerDeliveryPartner(@Valid @RequestBody DeliveryPartnerDTO dto) {
		return ResponseEntity.ok(deliveryPartnerService.registerDeliveryPartner(dto));
	}

	@PostMapping("/login")
	public ResponseEntity<com.feasto.dto.AuthResponseDTO> loginDeliveryPartner(@RequestBody LoginDTO dto) {
        org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword()));

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateToken(dto.getEmail());
        
        DeliveryPartnerDTO profile = deliveryPartnerService.loginDeliveryPartner(dto.getEmail(), dto.getPassword());
        
        return ResponseEntity.ok(new com.feasto.dto.AuthResponseDTO(jwt, profile));
	}

	@GetMapping("/{id}")
	public ResponseEntity<?> getDeliveryPartnerById(@PathVariable Long id) {
        try {
		    return ResponseEntity.ok(deliveryPartnerService.getDeliveryPartnerById(id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + " cause: " + (e.getCause() != null ? e.getCause().getMessage() : "null"));
        }
	}

	@GetMapping
	public ResponseEntity<List<DeliveryPartnerDTO>> getAllDeliveryPartners() {
		return ResponseEntity.ok(deliveryPartnerService.getAllDeliveryPartners());
	}

	@PreAuthorize("hasRole('DELIVERY_PARTNER')")
	@PutMapping("/{id}/availability")
	public ResponseEntity<DeliveryPartnerDTO> updateAvailability(@PathVariable Long id,
			@RequestBody DeliveryPartnerAvailabilityDTO dto) {
		boolean isAvailable = Boolean.TRUE.equals(dto.getAvailable());
		Location loc = dto.getCurrentLocation() != null ? mapper.toLocation(dto.getCurrentLocation()) : null;
		return ResponseEntity.ok(deliveryPartnerService.updateAvailability(id, isAvailable, loc));
	}

	@GetMapping("/{id}/orders")
	public ResponseEntity<List<OrderDTO>> getOrdersByDeliveryPartnerId(@PathVariable Long id) {
		return ResponseEntity.ok(orderService.getOrdersByDeliveryPartnerId(id));
	}

	// get available delivery partners
	@GetMapping("/available")
	public ResponseEntity<List<DeliveryPartnerDTO>> getAvailableDeliveryPartners() {
		return ResponseEntity.ok(deliveryPartnerService.getAvailableDeliveryPartners());
	}

	@GetMapping("/{id}/earnings")
	public ResponseEntity<String> getEarnings(@PathVariable Long id) {
		// Placeholder: Implement earnings logic
		return ResponseEntity.ok("Earnings calculation not implemented");
	}

	@PreAuthorize("hasRole('DELIVERY_PARTNER')")
	@PostMapping("/location")
	public ResponseEntity<Void> publishLocation(@RequestBody LocationUpdateDTO dto) {
		// broadcast to topic
		messagingTemplate.convertAndSend("/topic/delivery/locations", dto);
		// user-specific queue
		messagingTemplate.convertAndSendToUser("delivery-" + dto.getDeliveryPartnerId(), "/queue/locations", dto);
		return ResponseEntity.accepted().build();
	}

	@PreAuthorize("hasRole('DELIVERY_PARTNER')")
	@PutMapping("/{id}")
	public ResponseEntity<DeliveryPartnerDTO> updateDeliveryPartner(@PathVariable Long id, @RequestBody DeliveryPartnerDTO dto) {
		return ResponseEntity.ok(deliveryPartnerService.updateDeliveryPartner(id, dto));
	}

	@PreAuthorize("hasAnyRole('DELIVERY_PARTNER', 'ADMIN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteDeliveryPartner(@PathVariable Long id) {
		deliveryPartnerService.deleteDeliveryPartner(id);
		return ResponseEntity.noContent().build();
	}
}