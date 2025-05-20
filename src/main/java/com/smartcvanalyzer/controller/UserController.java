// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.controller;

import com.smartcvanalyzer.model.Application;
import com.smartcvanalyzer.model.Job;
import com.smartcvanalyzer.model.User;
import com.smartcvanalyzer.repository.ApplicationRepository;
import com.smartcvanalyzer.repository.JobRepository;
import com.smartcvanalyzer.repository.UserRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyForJob(
            @RequestParam("cvFile") MultipartFile cvFile,
            @RequestParam("jobId") Long jobId,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            logger.info("User {} applying for job ID: {}", authentication.getName(), jobId);
            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (user == null) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.badRequest().body(response);
            }

            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found"));

            // Save the CV file
            String uploadDir = "uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();
            String fileName = username + "_" + System.currentTimeMillis() + "_" + cvFile.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + fileName);
            Files.write(filePath, cvFile.getBytes());

            // Create application
            Application application = new Application(user, job, filePath.toString());
            applicationRepository.save(application);

            // Calculate match score
            double matchScore = calculateMatchScore(filePath.toString(), job.getCriteria());

            // Extract CV text
            String cvText = extractCVText(filePath.toString());

            response.put("success", true);
            response.put("matchScore", matchScore);
            response.put("cvText", cvText);
            response.put("message", "Application submitted successfully");
            logger.info("Application submitted successfully for user {} and job ID: {}", username, jobId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error submitting application: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Failed to submit application: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/my-applications")
    public ResponseEntity<List<Application>> getMyApplications(Authentication authentication) {
        try {
            logger.info("Fetching applications for user: {}", authentication.getName());
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            List<Application> applications = applicationRepository.findByUserId(user.getId());
            logger.info("Found {} applications for user: {}", applications.size(), authentication.getName());
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error fetching applications: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    private double calculateMatchScore(String cvPath, String criteria) {
        try {
            File cvFile = new File(cvPath);
            if (!cvFile.exists()) {
                logger.warn("CV file not found: {}", cvPath);
                return 0.0;
            }

            PDDocument document = PDDocument.load(cvFile);
            PDFTextStripper stripper = new PDFTextStripper();
            String cvText = stripper.getText(document);
            document.close();

            criteria = criteria.toLowerCase();
            cvText = cvText.toLowerCase();

            double score = 0.0;
            String[] criteriaWords = criteria.split("\\s+");
            for (String word : criteriaWords) {
                if (cvText.contains(word)) {
                    score += 10.0;
                }
            }

            return Math.min(score, 100.0);
        } catch (Exception e) {
            logger.error("Error calculating match score: {}", e.getMessage(), e);
            return 0.0;
        }
    }

    private String extractCVText(String cvPath) {
        try {
            File cvFile = new File(cvPath);
            if (!cvFile.exists()) {
                logger.warn("CV file not found: {}", cvPath);
                return "CV not available";
            }

            PDDocument document = PDDocument.load(cvFile);
            PDFTextStripper stripper = new PDFTextStripper();
            String cvText = stripper.getText(document);
            document.close();
            return cvText;
        } catch (Exception e) {
            logger.error("Error extracting CV text: {}", e.getMessage(), e);
            return "Error extracting CV text";
        }
    }
}