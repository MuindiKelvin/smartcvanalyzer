// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.repository;

import com.smartcvanalyzer.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    PasswordResetToken findByToken(String token);
}