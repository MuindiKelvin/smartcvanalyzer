// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.service;

import com.smartcvanalyzer.model.Application;
import com.smartcvanalyzer.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class FileStorageService {

    private final String uploadDir = "uploads/";

    @Autowired
    private ApplicationRepository applicationRepository;

    public String storeFile(MultipartFile file, String username) throws Exception {
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String fileName = username + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir + fileName);
        Files.write(filePath, file.getBytes());

        return filePath.toString();
    }

    public String storeGeneratedCV(String cvContent, String username) throws Exception {
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String fileName = username + "_" + System.currentTimeMillis() + "_generated_cv.txt";
        Path filePath = Paths.get(uploadDir + fileName);
        Files.write(filePath, cvContent.getBytes());

        return filePath.toString();
    }

    public String getCVContent(String username) throws Exception {
        List<Application> applications = applicationRepository.findByUserUsername(username);
        if (applications.isEmpty()) {
            throw new RuntimeException("No applications found for user: " + username);
        }

        Application latestApplication = applications.get(applications.size() - 1);
        Path filePath = Paths.get(latestApplication.getCvPath());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("CV file not found for user: " + username);
        }

        return Files.readString(filePath);
    }
}