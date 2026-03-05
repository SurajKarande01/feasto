package com.feasto.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

	@PostMapping("/register")
	public ResponseEntity<DeliveryPartnerDTO> registerDeliveryPartner(@Valid @RequestBody DeliveryPartnerDTO dto) {
		return ResponseEntity.ok(deliveryPartnerService.registerDeliveryPartner(dto));
	}

	@PostMapping("/login")
	public ResponseEntity<DeliveryPartnerDTO> loginDeliveryPartner(@RequestBody LoginDTO dto) {
		return ResponseEntity.ok(deliveryPartnerService.loginDeliveryPartner(dto.getEmail(), dto.getPassword()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<DeliveryPartnerDTO> getDeliveryPartnerById(@PathVariable Long id) {
		return ResponseEntity.ok(deliveryPartnerService.getDeliveryPartnerById(id));
	}

	@GetMapping
	public ResponseEntity<List<DeliveryPartnerDTO>> getAllDeliveryPartners() {
		return ResponseEntity.ok(deliveryPartnerService.getAllDeliveryPartners());
	}

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

	// Publish delivery partner location updates to subscribers (WebSocket topics)
	@PostMapping("/location")
	public ResponseEntity<Void> publishLocation(@RequestBody LocationUpdateDTO dto) {
		// broadcast to topic
		messagingTemplate.convertAndSend("/topic/delivery/locations", dto);
		// user-specific queue
		messagingTemplate.convertAndSendToUser("delivery-" + dto.getDeliveryPartnerId(), "/queue/locations", dto);
		return ResponseEntity.accepted().build();
	}
}