package com.ims.api.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
@CrossOrigin(origins = {"*"}, maxAge = 3600, allowCredentials = "false")
public class PublicController {
    
    private static final Logger logger = LoggerFactory.getLogger(PublicController.class);

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        logger.info("Health check endpoint accessed");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "Inventory Management System API");
        response.put("version", "1.0.0");
        
        logger.info("Health check successful: {}", response);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
    
    // Additional test endpoint for login check
    @GetMapping("/authtest")
    public ResponseEntity<?> authTest() {
        logger.info("Auth test endpoint accessed");
        
        Map<String, Object> response = new HashMap<>();
        response.put("adminCredentials", "Username: admin, Password: admin123");
        response.put("instructions", "Use these credentials to log in to the system");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
} 