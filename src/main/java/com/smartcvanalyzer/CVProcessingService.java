package com.smartcvanalyzer.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Service
public class CVProcessingService {

    public String extractText(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new IOException("Invalid file name");
        }

        try (InputStream inputStream = file.getInputStream()) {
            if (fileName.endsWith(".pdf")) {
                return extractTextFromPDF(inputStream);
            } else if (fileName.endsWith(".docx")) {
                return extractTextFromWord(inputStream);
            } else if (fileName.endsWith(".txt")) {
                return new String(inputStream.readAllBytes());
            } else {
                throw new IOException("Unsupported file format. Please upload a .txt, .docx, or .pdf file.");
            }
        }
    }

    private String extractTextFromPDF(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractTextFromWord(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder text = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                text.append(paragraph.getText()).append("\n");
            }
            return text.toString();
        }
    }

    public double calculateMatchScore(String cvText, String jobCriteria) {
        // Simple matching algorithm: Compare keywords in CV and job criteria
        Set<String> cvKeywords = extractKeywords(cvText);
        Set<String> jobKeywords = extractKeywords(jobCriteria);

        // Calculate intersection of keywords
        Set<String> commonKeywords = new HashSet<>(cvKeywords);
        commonKeywords.retainAll(jobKeywords);

        // Calculate match score as a percentage
        if (jobKeywords.isEmpty()) return 0.0;
        return (double) commonKeywords.size() / jobKeywords.size() * 100;
    }

    private Set<String> extractKeywords(String text) {
        // Simple keyword extraction: Split by whitespace and remove common stop words
        Set<String> stopWords = new HashSet<>(Arrays.asList("the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by"));
        return new HashSet<>(Arrays.asList(text.toLowerCase()
                .replaceAll("[^a-zA-Z0-9\\s]", "")
                .split("\\s+")))
                .stream()
                .filter(word -> !stopWords.contains(word))
                .collect(HashSet::new, HashSet::add, HashSet::addAll);
    }
}