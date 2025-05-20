package com.smartcvanalyzer.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**", "/css/**", "/js/**", "/index.html", "/signup.html", "/forgot-password.html").permitAll()
                // Allow ROLE_ADMIN full access to /api/admin/** and /api/candidates/rank/**
                .requestMatchers("/api/admin/**", "/api/candidates/rank/**").hasRole("ADMIN")
                // Allow ROLE_USER to access GET requests for /api/jobs/**
                .requestMatchers(HttpMethod.GET, "/api/jobs/**").hasAnyRole("USER", "ADMIN")
                // Restrict POST, PUT, DELETE on /api/jobs/** to ROLE_ADMIN
                .requestMatchers(HttpMethod.POST, "/api/jobs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/jobs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/jobs/**").hasRole("ADMIN")
                // User-specific endpoints
                .requestMatchers("/api/candidates/apply", "/api/files/**").hasRole("USER")
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .httpBasic(httpBasic -> {});
        
        return http.build();
    }
}