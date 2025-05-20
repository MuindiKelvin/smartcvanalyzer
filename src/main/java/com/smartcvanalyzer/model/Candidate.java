// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity
public class Candidate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    private double score;

    // Default constructor
    public Candidate() {
    }

    // Constructor with arguments
    public Candidate(User user, double score) {
        this.user = user;
        this.score = score;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
}