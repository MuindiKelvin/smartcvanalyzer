// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.controller;

import com.smartcvanalyzer.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileStorageController {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageController.class);

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file, Authentication authentication) {
        try {
            String username = authentication.getName();
            logger.info("Uploading file for user: {}", username);
            String filePath = fileStorageService.storeFile(file, username);
            logger.info("File uploaded successfully to: {}", filePath);
            return ResponseEntity.ok(filePath);
        } catch (Exception e) {
            logger.error("Error uploading file: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/upload-generated-cv")
    public ResponseEntity<String> uploadGeneratedCV(@RequestBody String cvContent, Authentication authentication) {
        try {
            String username = authentication.getName();
            logger.info("Uploading generated CV for user: {}", username);
            String filePath = fileStorageService.storeGeneratedCV(cvContent, username);
            logger.info("Generated CV uploaded successfully to: {}", filePath);
            return ResponseEntity.ok(filePath);
        } catch (Exception e) {
            logger.error("Error uploading generated CV: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/cv/{username}")
    public ResponseEntity<String> getCVContent(@PathVariable String username) {
        try {
            logger.info("Fetching CV content for user: {}", username);
            String cvContent = fileStorageService.getCVContent(username);
            logger.info("CV content fetched successfully for user: {}", username);
            return ResponseEntity.ok(cvContent);
        } catch (Exception e) {
            logger.error("Error fetching CV content: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}