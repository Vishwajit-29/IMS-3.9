package com.ims.api.controller;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ims.api.dto.AuthRequest;
import com.ims.api.dto.AuthResponse;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"*"}, maxAge = 3600, allowCredentials = "false")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    // Hardcoded admin credentials
    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_PASSWORD = "admin123";

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest loginRequest) {
        logger.info("Login attempt: {}", loginRequest.getUsername());
        
        // Simple direct comparison
        if (ADMIN_USERNAME.equals(loginRequest.getUsername()) && 
            ADMIN_PASSWORD.equals(loginRequest.getPassword())) {
            
            logger.info("Admin login successful");
            
            // Generate a simple token
            String token = UUID.randomUUID().toString();
            
            // Return success response with admin role
            Set<String> roles = Collections.singleton("ROLE_ADMIN");
            AuthResponse response = new AuthResponse(token, ADMIN_USERNAME, roles);
            
            return ResponseEntity.ok(response);
        }
        
        logger.warn("Login failed for user: {}", loginRequest.getUsername());
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Invalid username or password");
        return ResponseEntity.status(401).body(errorResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest registerRequest) {
        // For this simplified version, we only allow the admin user
        // and registration is disabled
        logger.info("Registration attempt (disabled): {}", registerRequest.getUsername());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Registration is currently disabled. Please use admin credentials.");
        return ResponseEntity.badRequest().body(response);
    }
} 