package com.feasto.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.feasto.dto.MenuItemDTO;
import com.feasto.dto.RestaurantAnalyticsDTO;
import com.feasto.dto.RestaurantDTO;
import com.feasto.entity.MenuItem;
import com.feasto.entity.Restaurant;
import com.feasto.enums.Role;
import com.feasto.exception.ResourceNotFoundException;
import com.feasto.exception.UnauthorizedException;
import com.feasto.exception.ValidationException;
import com.feasto.mapper.CustomMapper;
import com.feasto.repository.MenuItemRepository;
import com.feasto.repository.OrderRepository;
import com.feasto.repository.RestaurantRepository;
import com.feasto.repository.ReviewRepository;
import com.feasto.repository.UserRepository;
import com.feasto.repository.DeliveryPartnerRepository;
import com.feasto.util.ValidationUtil;

@Service
public class RestaurantService {

	private static final Logger logger = LoggerFactory.getLogger(RestaurantService.class);

	@Autowired
	private CloudinaryService cloudinaryService;

	@Autowired
	private CustomMapper mapper;

	@Autowired
	private RestaurantRepository restaurantRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private DeliveryPartnerRepository deliveryPartnerRepository;

	@Autowired
	private MenuItemRepository menuItemRepository;

	@Autowired
	private OrderRepository orderRepository;

	@Autowired
	private ReviewRepository reviewRepository;

	@Value("${img.max.size}")
	private double maxFileSizeMB;

	// EntityManager no longer required here; DB logic moved to repository
	// implementation

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

	private void validateEmailUniqueness(String email) {
		if (userRepository.existsByEmailIgnoreCase(email) || 
			restaurantRepository.existsByEmailIgnoreCase(email) || 
			deliveryPartnerRepository.existsByEmailIgnoreCase(email)) {
			throw new ValidationException("Email already registered");
		}
	}

	@CacheEvict(value = "nearbyRestaurantsCache", allEntries = true)
	public RestaurantDTO registerRestaurant(RestaurantDTO restaurantDTO) {
		validateEmailUniqueness(restaurantDTO.getEmail());
		Restaurant restaurant = mapper.toRestaurant(restaurantDTO);
		if (restaurant.getRole() == null) {
			restaurant.setRole(Role.RESTAURANT_OWNER);
		}
        restaurant.setPassword(passwordEncoder.encode(restaurant.getPassword()));
		Restaurant savedRestaurant = restaurantRepository.save(restaurant);
		return mapper.toRestaurantDTO(savedRestaurant);
	}

	@CacheEvict(value = "nearbyRestaurantsCache", allEntries = true)
	public RestaurantDTO registerRestaurant(RestaurantDTO restaurantDTO, MultipartFile image) {
		validateEmailUniqueness(restaurantDTO.getEmail());
		if (image != null && !image.isEmpty()) {
			ValidationUtil.validateImage(image, maxFileSizeMB);
			String orig = restaurantDTO.getName() == null ? "img"
					: restaurantDTO.getName().replaceAll("\\s+", "_");
			String rand = String.valueOf((int) (Math.random() * 9000) + 1000);
			String name = "restaurant-" + rand + "-" + orig;

			try {
				ImageUploadResult res = cloudinaryService.uploadImage(image, name);
				if (res != null) {
					restaurantDTO.setImageUrl(res.getImageUrl());
					restaurantDTO.setCloudinaryPublicId(res.getPublicId());
				}
			} catch (Exception ex) {
				logger.error("Failed to upload restaurant image to Cloudinary", ex);
				throw new ValidationException("Failed to upload image to Cloudinary: " + ex.getMessage());
			}
		}

		Restaurant restaurant = mapper.toRestaurant(restaurantDTO);
		restaurant.setIsActive(true); // newly registered restaurants are active by default
		if (restaurant.getRole() == null) {
			restaurant.setRole(Role.RESTAURANT_OWNER);
		}
        restaurant.setPassword(passwordEncoder.encode(restaurant.getPassword()));
		Restaurant savedRestaurant = restaurantRepository.save(restaurant);
		return mapper.toRestaurantDTO(savedRestaurant);
	}

	@Caching(evict = { @CacheEvict(value = "restaurantsAll", allEntries = true),
			@CacheEvict(value = "nearbyRestaurantsCache", allEntries = true),
			@CacheEvict(value = "restaurantById", key = "#id") })
	public RestaurantDTO updateRestaurant(Long id, RestaurantDTO dto, MultipartFile image) {
		Restaurant restaurant = restaurantRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));

		if (dto.getName() != null) restaurant.setName(dto.getName());
		if (dto.getPhoneNumber() != null) restaurant.setPhoneNumber(dto.getPhoneNumber());

		if (image != null && !image.isEmpty()) {
			ValidationUtil.validateImage(image, maxFileSizeMB);
			String orig = dto.getName() == null ? "img" : dto.getName().replaceAll("\\s+", "_");
			String rand = String.valueOf((int) (Math.random() * 9000) + 1000);
			String name = "restaurant-" + rand + "-" + orig;

			try {
				ImageUploadResult res = cloudinaryService.uploadImage(image, name);
				if (res != null) {
					if (restaurant.getCloudinaryPublicId() != null && !restaurant.getCloudinaryPublicId().isBlank()) {
						cloudinaryService.deleteImage(restaurant.getCloudinaryPublicId());
					}
					restaurant.setImageUrl(res.getImageUrl());
					restaurant.setCloudinaryPublicId(res.getPublicId());
				}
			} catch (Exception ex) {
				logger.error("Failed to upload restaurant image to Cloudinary", ex);
				throw new ValidationException("Failed to upload image to Cloudinary: " + ex.getMessage());
			}
		}
		
		Restaurant updated = restaurantRepository.save(restaurant);
		return mapper.toRestaurantDTO(updated);
	}

	@Cacheable(value = "restaurantById", key = "#id")  
	public RestaurantDTO getRestaurantById(Long id) {
		Restaurant restaurant = restaurantRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
		return mapper.toRestaurantDTO(restaurant);
	}

	@Cacheable(value = "restaurantsAll")
	public List<RestaurantDTO> getAllRestaurants() {
		return restaurantRepository.findAll().stream().map(mapper::toRestaurantDTO).collect(Collectors.toList());
	}

    // Login for restaurant using email and password
    public RestaurantDTO loginRestaurant(String email, String password) {
        Restaurant restaurant = restaurantRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        // Password is already verified by AuthenticationManager; just return the profile.
        return mapper.toRestaurantDTO(restaurant);
    }

	@Caching(evict = {
			@CacheEvict(value = "menuItemsByRestaurant", key = "#restaurantId"),
			@CacheEvict(value = "nearbyRestaurantsCache", allEntries = true)
	})
	public MenuItemDTO addMenuItem(Long restaurantId, MenuItemDTO menuItemDTO,
			MultipartFile image) {
		Restaurant restaurant = restaurantRepository.findById(restaurantId)
				.orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

		// If image file provided, validate and upload to imgbb first
		if (image != null && !image.isEmpty()) {
			ValidationUtil.validateImage(image,maxFileSizeMB);
			// generate semi-random name: r<restaurantId>-<random>-<originalFilename>
			String orig = menuItemDTO.getName() == null ? "img" : menuItemDTO.getName().replaceAll("\\s+", "_");
			String rand = String.valueOf((int) (Math.random() * 9000) + 1000);
			String name = "r" + restaurantId + "-" + rand + "-" + orig;
			
			logger.debug("Uploading menu item image with name: {}", name);
			ImageUploadResult res = cloudinaryService.uploadImage(image, name);
			if (res != null) {
				menuItemDTO.setImageUrl(res.getImageUrl());
				menuItemDTO.setCloudinaryPublicId(res.getPublicId());
			}
		}

		MenuItem menuItem = mapper.toMenuItem(menuItemDTO);
		menuItem.setRestaurant(restaurant);
		MenuItem savedMenuItem = menuItemRepository.save(menuItem);

		return mapper.toMenuItemDTO(savedMenuItem);
	}

	@Caching(evict = {
			@CacheEvict(value = "menuItemsByRestaurant", key = "#restaurantId"),
			@CacheEvict(value = "nearbyRestaurantsCache", allEntries = true)
	})
	public MenuItemDTO updateMenuItem(Long restaurantId, Long menuItemId, MenuItemDTO menuItemDTO,
			MultipartFile image) {
		MenuItem menuItem = menuItemRepository.findById(menuItemId)
				.orElseThrow(() -> new ResourceNotFoundException("MenuItem not found with id: " + menuItemId));
		if (!menuItem.getRestaurant().getRestaurantId().equals(restaurantId)) {
			throw new ValidationException("MenuItem does not belong to restaurant: " + restaurantId);
		}
		// If an image file is provided, upload it first, then delete previous image
		// (best-effort)
		if (image != null && !image.isEmpty()) {
			ValidationUtil.validateImage(image,maxFileSizeMB);
			String orig = menuItemDTO.getName() == null ? "img" : menuItemDTO.getName().replaceAll("\\s+", "_");
			String rand = String.valueOf((int) (Math.random() * 9000) + 1000);
			String name = "r" + restaurantId + "-" + rand + "-" + orig;

			// delete existing

			ImageUploadResult res = cloudinaryService.uploadImage(image, name);
			if (res != null) {
				if (menuItem.getCloudinaryPublicId() != null && !menuItem.getCloudinaryPublicId().isBlank()) {
					cloudinaryService.deleteImage(menuItem.getCloudinaryPublicId());
				}
				menuItem.setImageUrl(res.getImageUrl());
				menuItem.setCloudinaryPublicId(res.getPublicId());
			}
		}

		// Update textual fields
		menuItem.setName(menuItemDTO.getName());
		menuItem.setDescription(menuItemDTO.getDescription());
		menuItem.setPrice(menuItemDTO.getPrice());
		menuItem.setCategory(menuItemDTO.getCategory());
		menuItem.setIsAvailable(menuItemDTO.getIsAvailable());

		// If client provided new imageUrl/deleteUrl in DTO (e.g., external link),
		// update them.
		if (menuItemDTO.getImageUrl() != null) {
			if (menuItemDTO.getCloudinaryPublicId() != null) {
				if (menuItem.getCloudinaryPublicId() != null && !menuItem.getCloudinaryPublicId().isBlank()
						&& !menuItem.getCloudinaryPublicId().equals(menuItemDTO.getCloudinaryPublicId())) {
					cloudinaryService.deleteImage(menuItem.getCloudinaryPublicId());
				}
				menuItem.setCloudinaryPublicId(menuItemDTO.getCloudinaryPublicId());
			}
			menuItem.setImageUrl(menuItemDTO.getImageUrl());
		} else {
			// No imageUrl provided in DTO. Use explicit removeImage flag to decide.
			// If removeImage==true, client explicitly requested removal -> delete previous
			// image (best-effort)
			Boolean removeImage = menuItemDTO.getRemoveImage();
			if (Boolean.TRUE.equals(removeImage)) {
				if ((menuItem.getImageUrl() != null && !menuItem.getImageUrl().isBlank())
						|| (menuItem.getCloudinaryPublicId() != null && !menuItem.getCloudinaryPublicId().isBlank())) {
					if (menuItem.getCloudinaryPublicId() != null && !menuItem.getCloudinaryPublicId().isBlank()) {
						cloudinaryService.deleteImage(menuItem.getCloudinaryPublicId());
					}
					menuItem.setImageUrl(null);
					menuItem.setCloudinaryPublicId(null);
				}
			}
			// else: no new image and no explicit removal request -> keep existing image
		}
		MenuItem updatedMenuItem = menuItemRepository.save(menuItem);

		return mapper.toMenuItemDTO(updatedMenuItem);
	}

	@Caching(evict = {
			@CacheEvict(value = "menuItemsByRestaurant", key = "#restaurantId"),
			@CacheEvict(value = "nearbyRestaurantsCache", allEntries = true)
	})
	public void deleteMenuItem(Long restaurantId, Long menuItemId) {
		MenuItem menuItem = menuItemRepository.findById(menuItemId)
				.orElseThrow(() -> new ResourceNotFoundException("MenuItem not found with id: " + menuItemId));
		if (!menuItem.getRestaurant().getRestaurantId().equals(restaurantId)) {
			throw new ValidationException("MenuItem does not belong to restaurant: " + restaurantId);
		}
		// If there is a cloudinary public id, try to delete the image first
		// (best-effort)
		if (menuItem.getCloudinaryPublicId() != null && !menuItem.getCloudinaryPublicId().isBlank()) {
			cloudinaryService.deleteImage(menuItem.getCloudinaryPublicId());
		}
		menuItemRepository.delete(menuItem);

		// No notification sent for menu deletion (removed non-essential notifications)
	}

	@Transactional(readOnly = true)
	public List<MenuItemDTO> getMenuItemsByRestaurantId(Long restaurantId) {
		return menuItemRepository.findByRestaurant_RestaurantId(restaurantId).stream().map(mapper::toMenuItemDTO)
				.collect(Collectors.toList());
	}

	// New: paginated nearby restaurants based on lat/lon. Returns RestaurantDTOs
	// with distanceKm and a few special menu items.
	@Cacheable(value = "nearbyRestaurantsCache", key = "T(java.lang.String).format('%s:%s:%s:%s:%s:%s', #lat, #lon, #page, #limit, #sort, #maxDistanceKm)")
	public Page<RestaurantDTO> findNearbyRestaurants(double lat, double lon, int page,
			int limit, String sort, double maxDistanceKm) {
		Pageable pageable = PageRequest.of(page, limit);
		Page<Object[]> pageObjs = restaurantRepository.findNearbyWithDistance(lat, lon,
				pageable, sort, maxDistanceKm);

		List<RestaurantDTO> dtos = new ArrayList<>();
		for (Object[] row : pageObjs.getContent()) {
			// row[0] = Restaurant entity, row[1] = Double distanceKm
			Restaurant r = (Restaurant) row[0];
			Number distNum = (Number) row[1];
			RestaurantDTO dto = mapper.toRestaurantDTO(r);
			dto.setDistanceKm(distNum != null ? distNum.doubleValue() : null);
			List<MenuItemDTO> specials = menuItemRepository.findByRestaurant_RestaurantId(r.getRestaurantId())
					.stream()
					.filter(m -> Boolean.TRUE.equals(m.getIsAvailable()))
					.limit(3)
					.map(mapper::toMenuItemDTO)
					.collect(Collectors.toList());
			dto.setSpecialMenuItems(specials);
			dtos.add(dto);
		}

		PageImpl<RestaurantDTO> pageImpl = new PageImpl<>(dtos, pageable, pageObjs.getTotalElements());
		return pageImpl;
	}

	// New: random restaurants for first visit
	public List<RestaurantDTO> findRandomRestaurants(int limit) {
		List<Restaurant> restaurants = restaurantRepository.findRandomRestaurants(limit);
		List<RestaurantDTO> dtos = restaurants.stream().map(r -> {
			RestaurantDTO dto = mapper.toRestaurantDTO(r);
			// attach top 3 menu items
			// will change later to use a "isSpecial" flag or depend on frequently ordered
			List<MenuItemDTO> specials = menuItemRepository.findByRestaurant_RestaurantId(r.getRestaurantId())
					.stream()
					.filter(m -> Boolean.TRUE.equals(m.getIsAvailable()))
					.limit(3)
					.map(mapper::toMenuItemDTO)
					.collect(Collectors.toList());
			dto.setSpecialMenuItems(specials);
			return dto;
		}).collect(Collectors.toList());
		return dtos;
	}

	@Transactional(readOnly = true)
	public Page<RestaurantDTO> getRestaurantsByCity(String city, int page, int limit) {
		Pageable pageable = PageRequest.of(page, limit);
		org.springframework.data.domain.Page<Restaurant> pageRes = restaurantRepository
				.findByAddress_CityIgnoreCaseAndIsActiveTrue(city, pageable);
		List<RestaurantDTO> dtos = pageRes.getContent().stream().map(r -> {
			RestaurantDTO dto = mapper.toRestaurantDTO(r);
			List<MenuItemDTO> specials = menuItemRepository.findByRestaurant_RestaurantId(r.getRestaurantId())
					.stream()
					.filter(m -> Boolean.TRUE.equals(m.getIsAvailable()))
					.limit(3)
					.map(mapper::toMenuItemDTO)
					.collect(Collectors.toList());
			dto.setSpecialMenuItems(specials);
			return dto;
		}).collect(Collectors.toList());
		return new PageImpl<>(dtos, pageable, pageRes.getTotalElements());
	}

	// New: fuzzy search by name. Returns paged RestaurantDTOs.
	@Transactional(readOnly = true)
	public Page<RestaurantDTO> searchRestaurantsByName(String name, int page, int limit) {
		Pageable pageable = PageRequest.of(page, limit);
		// First try simple DB contains search
		Page<Restaurant> results = restaurantRepository
				.findByNameContainingIgnoreCaseAndIsActiveTrue(name, pageable);
		if (results.hasContent()) {
			List<RestaurantDTO> dtos = results.getContent().stream().map(r -> mapper.toRestaurantDTO(r))
					.collect(Collectors.toList());
			return new PageImpl<>(dtos, pageable, results.getTotalElements());
		}

		// Fallback: fuzzy match over all active restaurants using Levenshtein distance
		List<Restaurant> allActive = restaurantRepository.findByIsActiveTrue();
		final String q = name == null ? "" : name.trim().toLowerCase();
		// compute distance and score using simple ScoreHolder
		class ScoreHolder {
			final Restaurant r;
			final int score;

			ScoreHolder(Restaurant r, int score) {
				this.r = r;
				this.score = score;
			}
		}

		List<ScoreHolder> scored = allActive.stream()
				.map(r -> new ScoreHolder(r,
						levenshteinDistance(r.getName() == null ? "" : r.getName().toLowerCase(), q)))
				.sorted((a, b) -> Integer.compare(a.score, b.score))
				.collect(Collectors.toList());

		// take top page*limit..(page+1)*limit
		int start = page * limit;
		int end = Math.min(start + limit, scored.size());
		List<RestaurantDTO> dtos = new ArrayList<>();
		if (start < end) {
			List<ScoreHolder> slice = scored.subList(start, end);
			for (ScoreHolder p : slice) {
				dtos.add(mapper.toRestaurantDTO(p.r));
			}
		}
		return new PageImpl<>(dtos, pageable, scored.size());
	}

	// Small Levenshtein implementation (could be extracted to util)
	private int levenshteinDistance(String a, String b) {
		int[] costs = new int[b.length() + 1];
		for (int j = 0; j <= b.length(); j++)
			costs[j] = j;
		for (int i = 1; i <= a.length(); i++) {
			costs[0] = i;
			int nw = i - 1;
			for (int j = 1; j <= b.length(); j++) {
				int cj = Math.min(1 + Math.min(costs[j], costs[j - 1]),
						a.charAt(i - 1) == b.charAt(j - 1) ? nw : nw + 1);
				nw = costs[j];
				costs[j] = cj;
			}
		}
		return costs[b.length()];
	}

	// Analytics for a restaurant: orders, revenue, rating, top items
	@Transactional(readOnly = true)
	public RestaurantAnalyticsDTO getRestaurantAnalytics(Long restaurantId) {
		// ensure restaurant exists
		restaurantRepository.findById(restaurantId)
				.orElseThrow(() -> new com.feasto.exception.ResourceNotFoundException(
						"Restaurant not found with id: " + restaurantId));

		// Use repository-level aggregations to avoid loading all entities into memory
		Double totalRevenueObj = orderRepository.sumTotalAmountByRestaurantId(restaurantId);
		double totalRevenue = totalRevenueObj == null ? 0.0 : totalRevenueObj.doubleValue();

		long totalOrders = 0;
		long successfulOrders = 0;
		Map<String, Long> ordersByStatus = new HashMap<>();
		List<Object[]> statusCounts = orderRepository.countOrdersByStatusForRestaurant(restaurantId);
		for (Object[] row : statusCounts) {
			Object status = row[0];
			Number cnt = (Number) row[1];
			String key = status == null ? "UNKNOWN" : status.toString();
			long countVal = cnt == null ? 0L : cnt.longValue();
			ordersByStatus.put(key, countVal);
			totalOrders += countVal;
			if (!"CANCELLED".equals(key) && !"REJECTED".equals(key)) {
				successfulOrders += countVal;
			}
		}

		double averageOrderValue = successfulOrders > 0 ? totalRevenue / successfulOrders : 0.0;

		// Top menu items: use DB aggregation and limit to top 10
		List<Object[]> topRows = orderRepository.findTopMenuItemsByRestaurant(restaurantId, PageRequest.of(0, 10));
		List<RestaurantAnalyticsDTO.TopMenuItem> topItems = topRows.stream().map(r -> {
			Long menuItemId = r[0] == null ? null : ((Number) r[0]).longValue();
			String name = r[1] == null ? "" : r[1].toString();
			Long qty = r[2] == null ? 0L : ((Number) r[2]).longValue();
			Double rev = r[3] == null ? 0.0 : ((Number) r[3]).doubleValue();
			return new RestaurantAnalyticsDTO.TopMenuItem(menuItemId, name, qty, rev);
		}).collect(Collectors.toList());

		// Reviews & rating: aggregated
		Object[] reviewAgg = reviewRepository.countAndAverageRatingByRestaurant(restaurantId);
		long totalReviews = 0L;
		double avgRating = 0.0;
		if (reviewAgg != null && reviewAgg.length >= 2) {
			Number cnt = (Number) reviewAgg[0];
			Number avg = (Number) reviewAgg[1];
			totalReviews = cnt == null ? 0L : cnt.longValue();
			avgRating = avg == null ? 0.0 : avg.doubleValue();
		}

		RestaurantAnalyticsDTO dto = new RestaurantAnalyticsDTO();
		dto.setRestaurantId(restaurantId);
		dto.setTotalOrders(totalOrders);
		dto.setTotalRevenue(totalRevenue);
		dto.setAverageOrderValue(averageOrderValue);
		dto.setOrdersByStatus(ordersByStatus);
		dto.setTopMenuItems(topItems);
		dto.setTotalReviews(totalReviews);
		dto.setAverageRating(avgRating);

		return dto;
	}

	@Caching(evict = { @CacheEvict(value = "restaurantsAll", allEntries = true),
			@CacheEvict(value = "nearbyRestaurantsCache", allEntries = true),
			@CacheEvict(value = "restaurantById", key = "#id") })
	public void deleteRestaurant(Long id) {
		Restaurant restaurant = restaurantRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));

		if (restaurant.getCloudinaryPublicId() != null && !restaurant.getCloudinaryPublicId().isBlank()) {
			cloudinaryService.deleteImage(restaurant.getCloudinaryPublicId());
		}
		for (MenuItem item : restaurant.getMenuItems()) {
			if (item.getCloudinaryPublicId() != null && !item.getCloudinaryPublicId().isBlank()) {
				cloudinaryService.deleteImage(item.getCloudinaryPublicId());
			}
		}

		restaurantRepository.delete(restaurant);
	}
}