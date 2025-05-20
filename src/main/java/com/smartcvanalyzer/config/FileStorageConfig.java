package com.smartcvanalyzer.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Bean
    public String uploadDir() {
        return Paths.get(uploadDir).toAbsolutePath().normalize().toString();
    }
}