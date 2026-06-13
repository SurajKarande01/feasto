package com.feasto.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.feasto.dto.UserDTO;
import com.feasto.dto.UserRegistrationDTO;
import com.feasto.entity.User;
import com.feasto.exception.ResourceNotFoundException;
import com.feasto.exception.UnauthorizedException;
import com.feasto.exception.ValidationException;
import com.feasto.mapper.CustomMapper;
import com.feasto.repository.UserRepository;
import com.feasto.repository.RestaurantRepository;
import com.feasto.repository.DeliveryPartnerRepository;
import com.feasto.repository.LoyaltyProgramRepository;
import com.feasto.entity.LoyaltyProgram;

@Service
public class UserService {
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private DeliveryPartnerRepository deliveryPartnerRepository;

    @Autowired
    private LoyaltyProgramRepository loyaltyProgramRepository;

    @Autowired
    private CustomMapper mapper;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    /**
     * Registers a new customer account.
     * It checks email uniqueness across the system, maps registration details,
     * encodes the password, saves the user, and sends a welcome notification.
     */
    public UserDTO registerUser(UserRegistrationDTO registrationDTO) {
        String email = registrationDTO.getEmail();
        if (userRepository.existsByEmailIgnoreCase(email) || 
            restaurantRepository.existsByEmailIgnoreCase(email) || 
            deliveryPartnerRepository.existsByEmailIgnoreCase(email)) {
            throw new ValidationException("Email already registered");
        }
        User user = mapper.toUserFromRegistration(registrationDTO);
        // ensure default role
        if (user.getRole() == null) {
            user.setRole(com.feasto.enums.Role.CUSTOMER);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);

        // Notify user on registration
        com.feasto.dto.NotificationDTO notification = new com.feasto.dto.NotificationDTO();
        notification.setType("USER_REGISTERED");
        notification.setMessage("Welcome, " + savedUser.getName() + "! Your account has been created.");
        notification.setRecipientId(savedUser.getUserId());
        notificationService.notifyUser(savedUser.getUserId(), notification);

        return mapper.toUserDTO(savedUser);
    }

    /**
     * Validates credentials and logs in the customer, returning their profile details.
     */
    public UserDTO loginUser(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        // Password is already verified by AuthenticationManager; just return the profile.
        return mapper.toUserDTO(user);
    }

    /**
     * Fetches a specific customer's profile by their unique ID.
     */
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapper.toUserDTO(user);
    }

    /**
     * Returns a list of all registered customers in the system.
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(mapper::toUserDTO)
                .collect(Collectors.toList());
    }

    /**
     * Updates customer profile fields (such as name, phone number, or address coordinates).
     */
    public UserDTO updateUser(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        if (dto.getName() != null && !dto.getName().isBlank()) {
            user.setName(dto.getName());
        }
        if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().isBlank()) {
            user.setPhoneNumber(dto.getPhoneNumber());
        }
        if (dto.getAddress() != null) {
            user.setAddress(dto.getAddress());
        }
        
        User savedUser = userRepository.save(user);
        return mapper.toUserDTO(savedUser);
    }

    /**
     * Deletes a customer account and cleans up their associated loyalty program record.
     */
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Delete loyalty program if it exists to avoid FK constraint violation
        loyaltyProgramRepository.findByUser_UserId(id).ifPresent(lp -> {
            loyaltyProgramRepository.delete(lp);
        });

        userRepository.delete(user);
    }
}