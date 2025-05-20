// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.controller;

import com.smartcvanalyzer.model.User;
import com.smartcvanalyzer.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String username = request.get("username");
            String password = request.get("password");
            String email = request.get("email");

            if (username == null || password == null) {
                logger.warn("Registration failed: Missing required fields");
                response.put("success", false);
                response.put("message", "Username and password are required");
                return ResponseEntity.badRequest().body(response);
            }

            User existingUser = userRepository.findByUsername(username).orElse(null);
            if (existingUser != null) {
                logger.warn("Registration failed: Username already exists: {}", username);
                response.put("success", false);
                response.put("message", "Username already exists");
                return ResponseEntity.badRequest().body(response);
            }

            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(password));
            if (email != null) {
                user.setEmail(email);
            }
            user.setRoles(Set.of("ROLE_USER"));
            userRepository.save(user);

            logger.info("User registered successfully: {}", username);
            response.put("success", true);
            response.put("message", "User registered successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during registration: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        Map<String, Object> response = new HashMap<>();
        try {
            String username = request.get("username");
            String password = request.get("password");

            if (username == null || password == null) {
                logger.warn("Login failed: Username or password missing");
                response.put("success", false);
                response.put("message", "Username and password are required");
                return ResponseEntity.badRequest().body(response);
            }

            // Find the user first to check if they exist
            User user = userRepository.findByUsername(username).orElse(null);
            if (user == null) {
                logger.warn("Login failed: User not found: {}", username);
                response.put("success", false);
                response.put("message", "Invalid username or password");
                return ResponseEntity.badRequest().body(response);
            }

            // Verify password
            if (!passwordEncoder.matches(password, user.getPassword())) {
                logger.warn("Login failed: Invalid password for user: {}", username);
                response.put("success", false);
                response.put("message", "Invalid username or password");
                return ResponseEntity.badRequest().body(response);
            }

            // Create authentication token
            Set<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                    .map(role -> new SimpleGrantedAuthority(role))
                    .collect(Collectors.toSet());
                    
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(username, password, authorities);
            
            // Set authentication in SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authToken);
            
            // Store the security context in the session
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, 
                                SecurityContextHolder.getContext());

            Set<String> roles = user.getRoles();
            if (roles == null || roles.isEmpty()) {
                logger.warn("User has no roles assigned: {}", username);
                response.put("success", false);
                response.put("message", "User has no roles assigned");
                return ResponseEntity.badRequest().body(response);
            }

            String role = roles.iterator().next();
            logger.info("User logged in successfully: {}, Role: {}", username, role);
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("username", username);
            response.put("role", role);
            response.put("sessionId", session.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during login: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/current-user")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        Map<String, Object> response = new HashMap<>();
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && 
            !"anonymousUser".equals(authentication.getName())) {
            
            String username = authentication.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            
            if (user != null) {
                response.put("success", true);
                response.put("username", username);
                response.put("roles", user.getRoles());
                return ResponseEntity.ok(response);
            }
        }
        
        response.put("success", false);
        response.put("message", "Not authenticated");
        return ResponseEntity.status(401).body(response);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        
        SecurityContextHolder.clearContext();
        response.put("success", true);
        response.put("message", "Logged out successfully");
        
        return ResponseEntity.ok(response);
    }
}