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
    private CustomMapper mapper;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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

    public UserDTO loginUser(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        // Password is already verified by AuthenticationManager; just return the profile.
        return mapper.toUserDTO(user);
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapper.toUserDTO(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(mapper::toUserDTO)
                .collect(Collectors.toList());
    }

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
}