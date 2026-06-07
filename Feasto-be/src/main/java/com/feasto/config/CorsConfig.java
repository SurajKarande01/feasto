package com.feasto.config;

// This file has been intentionally removed.
// CORS configuration is handled by CorsConfigurationSource in SecurityConfig.java.
// Having two CORS beans (CorsFilter + CorsConfigurationSource) causes conflicts
// because CorsFilter runs before Spring Security and applies wildcard origin
// without credentials, overriding the stricter security-aware config.