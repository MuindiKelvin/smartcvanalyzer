// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.controller;

import com.smartcvanalyzer.model.Application;
import com.smartcvanalyzer.model.User;
import com.smartcvanalyzer.repository.ApplicationRepository;
import com.smartcvanalyzer.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/pending-applications")
    public ResponseEntity<List<Application>> getPendingApplications() {
        try {
            logger.info("Fetching pending applications");
            List<Application> applications = applicationRepository.findByStatus("PENDING");
            logger.info("Found {} pending applications", applications.size());
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error fetching pending applications: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/approve-application/{applicationId}")
    public ResponseEntity<String> approveApplication(@PathVariable Long applicationId) {
        try {
            logger.info("Approving application with ID: {}", applicationId);
            Application application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found"));
            application.setStatus("APPROVED");
            applicationRepository.save(application);
            logger.info("Application approved successfully");
            return ResponseEntity.ok("Application approved");
        } catch (Exception e) {
            logger.error("Error approving application: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/reject-application/{applicationId}")
    public ResponseEntity<String> rejectApplication(@PathVariable Long applicationId) {
        try {
            logger.info("Rejecting application with ID: {}", applicationId);
            Application application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found"));
            application.setStatus("REJECTED");
            applicationRepository.save(application);
            logger.info("Application rejected successfully");
            return ResponseEntity.ok("Application rejected");
        } catch (Exception e) {
            logger.error("Error rejecting application: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/applications")
    public ResponseEntity<List<Application>> getAllApplications() {
        try {
            logger.info("Fetching all applications");
            List<Application> applications = applicationRepository.findAll();
            logger.info("Found {} applications", applications.size());
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error fetching applications: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @DeleteMapping("/applications/{applicationId}")
    public ResponseEntity<String> deleteApplication(@PathVariable Long applicationId) {
        try {
            logger.info("Deleting application with ID: {}", applicationId);
            applicationRepository.deleteById(applicationId);
            logger.info("Application deleted successfully");
            return ResponseEntity.ok("Application deleted");
        } catch (Exception e) {
            logger.error("Error deleting application: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        try {
            logger.info("Fetching all users");
            List<User> users = userRepository.findAll();
            logger.info("Found {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching users: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<String> updateUser(@PathVariable Long userId, @RequestBody User updatedUser) {
        try {
            logger.info("Updating user with ID: {}", userId);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setUsername(updatedUser.getUsername());
            user.setEmail(updatedUser.getEmail());
            user.setRoles(updatedUser.getRoles());
            userRepository.save(user);
            logger.info("User updated successfully");
            return ResponseEntity.ok("User updated");
        } catch (Exception e) {
            logger.error("Error updating user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<String> deleteUser(@PathVariable Long userId) {
        try {
            logger.info("Deleting user with ID: {}", userId);
            userRepository.deleteById(userId);
            logger.info("User deleted successfully");
            return ResponseEntity.ok("User deleted");
        } catch (Exception e) {
            logger.error("Error deleting user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}