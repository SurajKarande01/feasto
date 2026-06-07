package com.feasto.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.feasto.dto.OrderDTO;
import com.feasto.enums.OrderStatus;
import com.feasto.service.OrderService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping
    public ResponseEntity<OrderDTO> placeOrder(@Valid @RequestBody OrderDTO dto) {
        return ResponseEntity.ok(orderService.placeOrder(dto));
    }

    /**
     * Automated assignment endpoint: assigns best available delivery partner to
     * order.
     * POST /api/orders/{id}/auto-assign-delivery-partner
     */
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    @PostMapping("/{id}/auto-assign-delivery-partner")
    public ResponseEntity<OrderDTO> autoAssignDeliveryPartner(@PathVariable Long id) {
        OrderDTO result = orderService.autoAssignDeliveryPartner(id);
        if (result == null) {
            return ResponseEntity.status(409).build(); // 409 Conflict: no available partner
        }
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    @PostMapping("/{id}/assign-delivery-partner")
    public ResponseEntity<OrderDTO> assignDeliveryPartner(@PathVariable Long id, @RequestParam Long deliveryPartnerId) {
        return ResponseEntity.ok(orderService.assignDeliveryPartner(id, deliveryPartnerId));
    }

    @PreAuthorize("hasAnyRole('CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER')")
    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN')")
    @PutMapping("/{id}/status") // PLACED, CANCELLED, PREPARING, ACCEPTED, REJECTED, OUT_FOR_DELIVERY, DELIVERED 
    public ResponseEntity<OrderDTO> updateOrderStatus(@PathVariable Long id, @RequestParam OrderStatus orderStatus) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, orderStatus));
    }

    // Quick commerce orders use same endpoint with orderType in OrderDTO
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/quick-commerce")
    public ResponseEntity<OrderDTO> placeQuickCommerceOrder(@Valid @RequestBody OrderDTO dto) {
        // Assuming orderType is set to QUICK_COMMERCE in DTO
        return ResponseEntity.ok(orderService.placeOrder(dto));
    }

    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    @GetMapping("/quick-commerce/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getQuickCommerceOrdersByUserId(@PathVariable Long userId) {
        // Filter by orderType in service if needed
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }
}