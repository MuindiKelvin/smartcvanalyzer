// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.service;

import com.smartcvanalyzer.model.Job;
import com.smartcvanalyzer.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class JobService {
    @Autowired
    private JobRepository jobRepository;

    public Job createJob(Job job) {
        return jobRepository.save(job);
    }

    public Job findJobById(Long id) {
        return jobRepository.findById(id).orElse(null);
    }
}