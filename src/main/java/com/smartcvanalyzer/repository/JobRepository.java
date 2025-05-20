// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.repository;

import com.smartcvanalyzer.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobRepository extends JpaRepository<Job, Long> {
}