// Student ID: 2366790
// Group Name: Jackboys

package com.smartcvanalyzer.service;

import com.smartcvanalyzer.model.*;
import com.smartcvanalyzer.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ApplicationService {
    @Autowired
    private ApplicationRepository applicationRepository;

    public Application applyForJob(Application application) {
        return applicationRepository.save(application);
    }

    public List<com.smartcvanalyzer.model.Candidate> rankCandidates(Job job) {
        List<Application> applications = applicationRepository.findByJob(job);
        JobDescription jobDescription = new JobDescription(job.getDescription() + "\n" + job.getCriteria());
        jobDescription.extractRequirements();

        List<ParsedCandidate> parsedCandidates = new ArrayList<>();
        ResumeParser parser = new ResumeParser();

        for (Application app : applications) {
            try {
                String content = readFile(app.getCvPath());
                ParsedCandidate candidate = parser.parse(content);
                candidate.setFilePath(app.getCvPath());
                candidate.setUser(app.getUser());
                parsedCandidates.add(candidate);
            } catch (IOException e) {
                System.err.println("Error reading CV: " + e.getMessage());
            }
        }

        Matcher matcher = new Matcher();
        List<ScoredCandidate> scoredCandidates = matcher.matchCandidates(parsedCandidates, jobDescription);
        RankingEngine rankingEngine = new RankingEngine();
        List<ScoredCandidate> rankedCandidates = rankingEngine.rankCandidates(scoredCandidates);

        return rankedCandidates.stream().map(sc -> {
            com.smartcvanalyzer.model.Candidate webCandidate = new com.smartcvanalyzer.model.Candidate(sc.getCandidate().getUser(), sc.getScore());
            return webCandidate;
        }).collect(Collectors.toList());
    }

    private String readFile(String filePath) throws IOException {
        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        }
        return content.toString();
    }
}

class JobDescription {
    private String rawText;
    private List<String> skills;
    private Map<String, Integer> experience;

    public JobDescription(String text) {
        this.rawText = text;
        this.skills = new ArrayList<>();
        this.experience = new HashMap<>();
    }

    public void extractRequirements() {
        String[] lines = rawText.split("\n");
        for (String line : lines) {
            if (line.toLowerCase().contains("skill") || 
                line.toLowerCase().contains("knowledge") ||
                line.toLowerCase().contains("proficient")) {
                extractSkills(line);
            }
            if (line.toLowerCase().contains("experience") || 
                line.toLowerCase().contains("year")) {
                extractExperience(line);
            }
        }
        if (skills.isEmpty()) {
            String[] words = rawText.split("\\s+");
            for (String word : words) {
                if (word.length() > 3 && Character.isUpperCase(word.charAt(0))) {
                    skills.add(word.replaceAll("[^a-zA-Z]", ""));
                }
            }
        }
    }

    private void extractSkills(String line) {
        String[] words = line.split("\\s+");
        for (String word : words) {
            word = word.replaceAll("[^a-zA-Z]", "");
            if (word.length() > 2 && !isCommonWord(word)) {
                skills.add(word);
            }
        }
    }

    private void extractExperience(String line) {
        String[] words = line.split("\\s+");
        for (int i = 0; i < words.length - 3; i++) {
            try {
                if (words[i+1].toLowerCase().startsWith("year")) {
                    int years = Integer.parseInt(words[i]);
                    String skill = words[i+3];
                    experience.put(skill, years);
                }
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                // Skip
            }
        }
    }

    private boolean isCommonWord(String word) {
        String[] commonWords = {"the", "and", "for", "with", "this", "that", "have", "from"};
        word = word.toLowerCase();
        for (String commonWord : commonWords) {
            if (word.equals(commonWord)) {
                return true;
            }
        }
        return false;
    }

    public List<String> getSkills() {
        return skills;
    }

    public Map<String, Integer> getExperience() {
        return experience;
    }
}

class ParsedCandidate {
    private com.smartcvanalyzer.model.User user;
    private String name;
    private String contactDetails;
    private List<String> skills;
    private List<String> education;
    private Map<String, Integer> experience;
    private String filePath;

    public ParsedCandidate() {
        this.skills = new ArrayList<>();
        this.education = new ArrayList<>();
        this.experience = new HashMap<>();
    }

    public com.smartcvanalyzer.model.User getUser() { return user; }
    public void setUser(com.smartcvanalyzer.model.User user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContactDetails() { return contactDetails; }
    public void setContactDetails(String contactDetails) { this.contactDetails = contactDetails; }
    public List<String> getSkills() { return skills; }
    public void addSkill(String skill) { this.skills.add(skill); }
    public List<String> getEducation() { return education; }
    public void addEducation(String education) { this.education.add(education); }
    public Map<String, Integer> getExperience() { return experience; }
    public void addExperience(String field, int years) { this.experience.put(field, years); }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
}

class ResumeParser {
    public ParsedCandidate parse(String text) {
        ParsedCandidate candidate = new ParsedCandidate();
        String[] lines = text.split("\n");
        for (String line : lines) {
            if (!line.trim().isEmpty()) {
                candidate.setName(line.trim());
                break;
            }
        }

        String emailRegex = "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(emailRegex);
        java.util.regex.Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            candidate.setContactDetails(matcher.group());
        }

        extractSkills(text, candidate);
        extractExperience(text, candidate);
        return candidate;
    }

    private void extractSkills(String text, ParsedCandidate candidate) {
        int skillsIndex = text.toLowerCase().indexOf("skill");
        if (skillsIndex != -1) {
            String skillsSection = text.substring(skillsIndex);
            String[] potentialSkills = skillsSection.split("[,;:\\n]");
            for (String skill : potentialSkills) {
                skill = skill.trim();
                if (skill.length() > 1 && !skill.toLowerCase().contains("skill")) {
                    candidate.addSkill(skill);
                }
            }
        }
    }

    private void extractExperience(String text, ParsedCandidate candidate) {
        int experienceIndex = text.toLowerCase().indexOf("experience");
        if (experienceIndex != -1) {
            String experienceSection = text.substring(experienceIndex);
            String[] words = experienceSection.split("\\s+");
            for (int i = 0; i < words.length - 2; i++) {
                try {
                    int years = Integer.parseInt(words[i]);
                    if (words[i+1].toLowerCase().startsWith("year")) {
                        String field = words[i+2].replaceAll("[^a-zA-Z]", "");
                        candidate.addExperience(field, years);
                    }
                } catch (NumberFormatException e) {
                    // Skip
                }
            }
        }
    }
}

class Matcher {
    public List<ScoredCandidate> matchCandidates(List<ParsedCandidate> candidates, JobDescription jobDescription) {
        List<ScoredCandidate> scoredCandidates = new ArrayList<>();
        for (ParsedCandidate candidate : candidates) {
            double score = calculateScore(candidate, jobDescription);
            scoredCandidates.add(new ScoredCandidate(candidate, score));
        }
        return scoredCandidates;
    }

    private double calculateScore(ParsedCandidate candidate, JobDescription jobDescription) {
        double skillScore = matchSkills(candidate.getSkills(), jobDescription.getSkills());
        double experienceScore = matchExperience(candidate.getExperience(), jobDescription.getExperience());
        return (skillScore * 0.6) + (experienceScore * 0.4);
    }

    private double matchSkills(List<String> candidateSkills, List<String> requiredSkills) {
        if (requiredSkills.isEmpty()) return 100.0;
        int matches = 0;
        for (String requiredSkill : requiredSkills) {
            for (String candidateSkill : candidateSkills) {
                if (candidateSkill.toLowerCase().contains(requiredSkill.toLowerCase()) ||
                    requiredSkill.toLowerCase().contains(candidateSkill.toLowerCase())) {
                    matches++;
                    break;
                }
            }
        }
        return (double) matches / requiredSkills.size() * 100.0;
    }

    private double matchExperience(Map<String, Integer> candidateExp, Map<String, Integer> requiredExp) {
        if (requiredExp.isEmpty()) return 100.0;
        int totalRequirements = requiredExp.size();
        double totalScore = 0.0;
        for (Map.Entry<String, Integer> requirement : requiredExp.entrySet()) {
            String field = requirement.getKey();
            int requiredYears = requirement.getValue();
            boolean fieldMatched = false;
            for (Map.Entry<String, Integer> candidateField : candidateExp.entrySet()) {
                if (candidateField.getKey().toLowerCase().contains(field.toLowerCase()) ||
                    field.toLowerCase().contains(candidateField.getKey().toLowerCase())) {
                    int candidateYears = candidateField.getValue();
                    double fieldScore = Math.min(1.0, (double) candidateYears / requiredYears) * 100.0;
                    totalScore += fieldScore;
                    fieldMatched = true;
                    break;
                }
            }
            if (!fieldMatched) totalScore += 0.0;
        }
        return totalScore / totalRequirements;
    }
}

class ScoredCandidate {
    private ParsedCandidate candidate;
    private double score;

    public ScoredCandidate(ParsedCandidate candidate, double score) {
        this.candidate = candidate;
        this.score = score;
    }

    public ParsedCandidate getCandidate() { return candidate; }
    public double getScore() { return score; }
}

class RankingEngine {
    public List<ScoredCandidate> rankCandidates(List<ScoredCandidate> candidates) {
        candidates.sort((c1, c2) -> Double.compare(c2.getScore(), c1.getScore()));
        return candidates;
    }
}