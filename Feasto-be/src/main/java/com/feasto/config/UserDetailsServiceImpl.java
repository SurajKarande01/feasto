package com.feasto.config;

import java.util.Collections;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.feasto.entity.DeliveryPartner;
import com.feasto.entity.Restaurant;
import com.feasto.entity.User;
import com.feasto.repository.DeliveryPartnerRepository;
import com.feasto.repository.RestaurantRepository;
import com.feasto.repository.UserRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private RestaurantRepository restaurantRepository;

	@Autowired
	private DeliveryPartnerRepository deliveryPartnerRepository;

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		// Try User
		Optional<User> user = userRepository.findByEmail(email);
		if (user.isPresent()) {
			return buildUserDetails(user.get().getEmail(), user.get().getPassword(), user.get().getRole().name());
		}

		// Try Restaurant
		Optional<Restaurant> restaurant = restaurantRepository.findByEmail(email);
		if (restaurant.isPresent()) {
			return buildUserDetails(restaurant.get().getEmail(), restaurant.get().getPassword(), restaurant.get().getRole().name());
		}

		// Try DeliveryPartner
		Optional<DeliveryPartner> deliveryPartner = deliveryPartnerRepository.findByEmailIgnoreCase(email);
		if (deliveryPartner.isPresent()) {
			return buildUserDetails(deliveryPartner.get().getEmail(), deliveryPartner.get().getPassword(), deliveryPartner.get().getRole().name());
		}

		throw new UsernameNotFoundException("User Not Found with email: " + email);
	}

	private UserDetails buildUserDetails(String email, String password, String role) {
		if (email == null || email.isBlank()) {
			throw new UsernameNotFoundException("Account has no email set");
		}
		if (password == null || password.isBlank()) {
			throw new UsernameNotFoundException("Account password is not set for: " + email);
		}
		// Guard against legacy plain-text passwords — BCrypt hashes always start with $2a$ or $2b$
		if (!password.startsWith("$2a$") && !password.startsWith("$2b$")) {
			throw new UsernameNotFoundException(
					"Account '" + email + "' has an invalid password format. Please re-register.");
		}
		return new org.springframework.security.core.userdetails.User(
				email,
				password,
				Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "USER")))
		);
	}
}
