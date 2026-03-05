package com.feasto.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.feasto.dto.UserDTO;
import com.feasto.entity.User;
import com.feasto.exception.ResourceNotFoundException;
import com.feasto.exception.UnauthorizedException;
import com.feasto.exception.ValidationException;
import com.feasto.mapper.CustomMapper;
import com.feasto.repository.UserRepository;

@Service
public class UserService {
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomMapper mapper;

    public UserDTO registerUser(UserDTO userDTO) {
        if (userRepository.findByEmail(userDTO.getEmail()).isPresent()) {
            throw new ValidationException("Email already exists");
        }
        User user = mapper.toUser(userDTO);
        // ensure default role
        if (user.getRole() == null) {
            user.setRole(com.feasto.enums.Role.CUSTOMER);
        }
        user.setPassword(user.getPassword());
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
        System.out.println(user.getPassword());
        System.out.println(password);
        if (!user.getPassword().equals(password)) {
            throw new UnauthorizedException("Invalid credentials");
        }
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
}