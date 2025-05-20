// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.repository;

import com.smartcvanalyzer.model.Application;
import com.smartcvanalyzer.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStatus(String status);
    List<Application> findByJobId(Long jobId);
    List<Application> findByUserId(Long userId);
    List<Application> findByUserUsername(String username);
    List<Application> findByJob(Job job);
}