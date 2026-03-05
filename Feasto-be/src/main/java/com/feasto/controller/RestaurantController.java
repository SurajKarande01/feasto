package com.feasto.controller;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.feasto.dto.LoginDTO;
import com.feasto.dto.MenuItemDTO;
import com.feasto.dto.OrderDTO;
import com.feasto.dto.RestaurantDTO;
import com.feasto.dto.ReviewDTO;
import com.feasto.enums.OrderStatus;
import com.feasto.service.OrderService;
import com.feasto.service.RestaurantService;
import com.feasto.service.ReviewService;

@RestController
@RequestMapping("/restaurants")
@CrossOrigin(origins = "http://localhost:8080/")
public class RestaurantController {

    @Autowired
    private RestaurantService restaurantService;


    @Autowired
    private OrderService orderService;

    @Autowired
    private ReviewService reviewService;

    // small executor for background SSE tasks
    private final ExecutorService sseExecutor = Executors.newCachedThreadPool();

    // Register a new restaurant (multipart: restaurant JSON + optional image)
    @PostMapping(path = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RestaurantDTO> registerRestaurant(
            @RequestPart("restaurant") String restaurantJson, // Changed to @RequestPart
            @RequestPart(value = "image", required = false) MultipartFile image // Changed to @RequestPart
    ) throws Exception {
        
        ObjectMapper mapper = new ObjectMapper();
        RestaurantDTO dto = mapper.readValue(restaurantJson, RestaurantDTO.class);
        
        return ResponseEntity.ok(restaurantService.registerRestaurant(dto, image));
    }

    @PostMapping("/login")
    public ResponseEntity<RestaurantDTO> loginRestaurant(@RequestBody LoginDTO dto) {
        return ResponseEntity.ok(restaurantService.loginRestaurant(dto.getEmail(), dto.getPassword()));
    }

    // Get restaurant by ID
    @GetMapping("/{id}")
    public ResponseEntity<RestaurantDTO> getRestaurantById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.getRestaurantById(id));
    }

    // List all active restaurants
    @GetMapping
    public ResponseEntity<List<RestaurantDTO>> getAllRestaurants() {
        return ResponseEntity.ok(restaurantService.getAllRestaurants());
    }

    // New: search restaurants by name with pagination
    @GetMapping("/search")
    public ResponseEntity<?> searchRestaurantsByName(@RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(restaurantService.searchRestaurantsByName(name, page, limit));
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<?> getRestaurantsByCity(@PathVariable String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(restaurantService.getRestaurantsByCity(city, page, limit));
    }

    // New: get nearby restaurants by latitude/longitude with pagination and
    // optional sort
    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyRestaurants(
            @RequestParam double mylat,
            @RequestParam double mylon,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "distance") String sort,
            @RequestParam(name = "maxDistanceKm", defaultValue = "50") double maxDistanceKm) {
        Page<RestaurantDTO> result = restaurantService
                .findNearbyRestaurants(mylat, mylon, page, limit, sort, maxDistanceKm);
        return ResponseEntity.ok(result);
    }

    // New: random restaurants to show before location is provided
    @GetMapping("/random")
    public ResponseEntity<List<RestaurantDTO>> getRandomRestaurants(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(restaurantService.findRandomRestaurants(limit));
    }

    // Server-Sent Events: stream nearby restaurants periodically (useful for
    // real-time discovery)
    @GetMapping(path = "/nearby/stream", produces = "text/event-stream")
    public SseEmitter streamNearbyRestaurants(
            @RequestParam double mylat,
            @RequestParam double mylon,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "distance") String sort,
            @RequestParam(name = "maxDistanceKm", defaultValue = "50") double maxDistanceKm) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        sseExecutor.submit(() -> {
            try {
                // initial payload
                Page<RestaurantDTO> initial = restaurantService.findNearbyRestaurants(mylat, mylon, page, limit, sort,
                        maxDistanceKm);
                emitter.send(initial);

                // then periodically send updates every 10 seconds for a short-lived stream
                for (int i = 0; i < 6; i++) { // stream for ~1 minute
                    TimeUnit.SECONDS.sleep(10);
                    Page<RestaurantDTO> update = restaurantService.findNearbyRestaurants(mylat, mylon, page, limit, sort,
                            maxDistanceKm);
                    emitter.send(update);
                }
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        });
        return emitter;
    }

    // add a menu item to a restaurant (multi-part: image file + menuItem JSON)
    @PostMapping(path = "/{restaurantId}/menu", consumes = { "multipart/form-data" })
    public ResponseEntity<MenuItemDTO> addMenuItem(@PathVariable Long restaurantId,
            @RequestParam("menuItem") String menuItemJson,
            @RequestParam(value = "image", required = false) MultipartFile image)
            throws Exception {
        // parse menuItemJson into MenuItemDTO
        ObjectMapper mapper = new ObjectMapper();
        MenuItemDTO dto = mapper.readValue(menuItemJson, MenuItemDTO.class);
        return ResponseEntity.ok(restaurantService.addMenuItem(restaurantId, dto, image));
    }

    // update a menu item of a restaurant (single endpoint handles textual updates
    // and optional image replacement)
    @PutMapping(path = "/{restaurantId}/menu/{menuItemId}", consumes = { "multipart/form-data" })
    public ResponseEntity<MenuItemDTO> updateMenuItem(@PathVariable Long restaurantId,
            @PathVariable Long menuItemId,
            @RequestParam("menuItem") String menuItemJson,
            @RequestParam(value = "image", required = false) MultipartFile image) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        MenuItemDTO dto = mapper.readValue(menuItemJson, MenuItemDTO.class);
        return ResponseEntity.ok(restaurantService.updateMenuItem(restaurantId, menuItemId, dto, image));
    }

    // delete a menu item of a restaurant
    @DeleteMapping("/{restaurantId}/menu/{menuItemId}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long restaurantId, @PathVariable Long menuItemId) {
        restaurantService.deleteMenuItem(restaurantId, menuItemId);
        return ResponseEntity.noContent().build();
    }

   

    // get menu items of a restaurant
    @GetMapping("/{restaurantId}/menu")
    public ResponseEntity<List<MenuItemDTO>> getMenuItemsByRestaurantId(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantService.getMenuItemsByRestaurantId(restaurantId));
    }

    // get orders of a restaurant
    @GetMapping("/{restaurantId}/orders")
    public ResponseEntity<Page<OrderDTO>> getOrdersByRestaurantId(
            @PathVariable Long restaurantId,
            @RequestParam(defaultValue = "PLACED") OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(orderService.getOrdersByRestaurantId(restaurantId, status, page, limit));
    }

    // get reviews of a restaurant
    @GetMapping("/{restaurantId}/reviews")
    public ResponseEntity<List<ReviewDTO>> getReviewsByRestaurantId(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reviewService.getReviewsByRestaurantId(restaurantId));
    }

    // Analytics: consolidated metrics for a restaurant
    @GetMapping("/{restaurantId}/analytics")
    public ResponseEntity<?> getRestaurantAnalytics(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantService.getRestaurantAnalytics(restaurantId));
    }

}