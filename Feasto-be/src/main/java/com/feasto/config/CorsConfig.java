package com.feasto.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow specific origins (e.g., your front-end URL)
        config.addAllowedOrigin("*"); // Allow all origins for development; restrict in production");

        // Allow specific HTTP methods (GET, POST, PUT, DELETE, etc.)
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS"); // Required for pre-flight requests

        // Allow specific headers
        config.addAllowedHeader("*");

        // Allow credentials (e.g., cookies, authorization headers), if needed
        //config.setAllowCredentials(true);

        // Set max age for pre-flight request caching (in seconds)
        config.setMaxAge(3600L);

        // Apply CORS configuration to all end points
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}