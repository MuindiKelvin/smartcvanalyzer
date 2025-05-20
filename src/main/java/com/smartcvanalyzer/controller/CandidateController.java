// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.controller;

import com.smartcvanalyzer.model.Application;
import com.smartcvanalyzer.repository.ApplicationRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private static final Logger logger = LoggerFactory.getLogger(CandidateController.class);

    @Autowired
    private ApplicationRepository applicationRepository;

    static class Candidate {
        public Application application;
        public double score;

        public Candidate(Application application, double score) {
            this.application = application;
            this.score = score;
        }

        // Getters for serialization
        public Application getApplication() {
            return application;
        }

        public double getScore() {
            return score;
        }
    }

    @GetMapping("/rank/{jobId}")
    public ResponseEntity<List<Candidate>> rankCandidates(@PathVariable Long jobId) {
        try {
            logger.info("Ranking candidates for job ID: {}", jobId);
            List<Application> applications = applicationRepository.findByJobId(jobId);
            List<Candidate> candidates = new ArrayList<>();

            for (Application app : applications) {
                // Log the username to verify it's present
                logger.info("Processing application ID: {}, Username: {}", app.getId(), app.getUser() != null ? app.getUser().getUsername() : "null");
                double score = calculateScore(app);
                if (score >= 50.0) {
                    app.setStatus("APPROVED");
                    applicationRepository.save(app);
                }
                candidates.add(new Candidate(app, score));
            }

            candidates.sort((a, b) -> Double.compare(b.score, a.score));
            logger.info("Ranked {} candidates for job ID: {}", candidates.size(), jobId);
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            logger.error("Error ranking candidates: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/rank-by-username/{username}")
    public ResponseEntity<List<Candidate>> rankCandidatesByUsername(@PathVariable String username) {
        try {
            logger.info("Ranking candidates for username: {}", username);
            List<Application> applications = applicationRepository.findByUserUsername(username);
            List<Candidate> candidates = new ArrayList<>();

            for (Application app : applications) {
                double score = calculateScore(app);
                candidates.add(new Candidate(app, score));
            }

            candidates.sort((a, b) -> Double.compare(b.score, a.score));
            logger.info("Ranked {} candidates for username: {}", candidates.size(), username);
            return ResponseEntity.ok(candidates);
        } catch (Exception e) {
            logger.error("Error ranking candidates for username: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    private double calculateScore(Application application) {
        try {
            File cvFile = new File(application.getCvPath());
            if (!cvFile.exists()) {
                logger.warn("CV file not found for application ID: {}", application.getId());
                return 0.0;
            }

            PDDocument document = PDDocument.load(cvFile);
            PDFTextStripper stripper = new PDFTextStripper();
            String cvText = stripper.getText(document);
            document.close();

            String criteria = application.getJob().getCriteria().toLowerCase();
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
            logger.error("Error calculating score for application ID {}: {}", application.getId(), e.getMessage(), e);
            return 0.0;
        }
    }
}