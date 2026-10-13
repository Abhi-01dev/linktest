package com.linktest.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class QuestionBankDto {

    public static class CreateQuestionRequest {
        private String question_text;
        private List<String> options = new ArrayList<>();
        private Integer correct_option_index;
        private String correct_answer;
        private String subject;
        private String topic;
        private String difficulty;
        private String explanation;
        private BigDecimal marks;
        private BigDecimal negative_marks;

        public String getQuestion_text() { return question_text; }
        public void setQuestion_text(String question_text) { this.question_text = question_text; }

        public List<String> getOptions() { return options; }
        public void setOptions(List<String> options) { this.options = options; }

        public Integer getCorrect_option_index() { return correct_option_index; }
        public void setCorrect_option_index(Integer correct_option_index) { this.correct_option_index = correct_option_index; }

        public String getCorrect_answer() { return correct_answer; }
        public void setCorrect_answer(String correct_answer) { this.correct_answer = correct_answer; }

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }

        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }

        public BigDecimal getMarks() { return marks; }
        public void setMarks(BigDecimal marks) { this.marks = marks; }

        public BigDecimal getNegative_marks() { return negative_marks; }
        public void setNegative_marks(BigDecimal negative_marks) { this.negative_marks = negative_marks; }
    }

    public static class ImportCsvRequest {
        private String csvContent;
        private String duplicateStrategy = "skip";

        public String getCsvContent() { return csvContent; }
        public void setCsvContent(String csvContent) { this.csvContent = csvContent; }

        public String getDuplicateStrategy() { return duplicateStrategy; }
        public void setDuplicateStrategy(String duplicateStrategy) { this.duplicateStrategy = duplicateStrategy; }
    }

    public static class PreviewResponse {
        private int totalRows;
        private int validCount;
        private int warningCount;
        private int errorCount;
        private int duplicateCount;
        private String duplicateStrategy;
        private List<Map<String, Object>> previewRows = new ArrayList<>();
        private List<Map<String, Object>> errors = new ArrayList<>();

        public int getTotalRows() { return totalRows; }
        public void setTotalRows(int totalRows) { this.totalRows = totalRows; }

        public int getValidCount() { return validCount; }
        public void setValidCount(int validCount) { this.validCount = validCount; }

        public int getWarningCount() { return warningCount; }
        public void setWarningCount(int warningCount) { this.warningCount = warningCount; }

        public int getErrorCount() { return errorCount; }
        public void setErrorCount(int errorCount) { this.errorCount = errorCount; }

        public int getDuplicateCount() { return duplicateCount; }
        public void setDuplicateCount(int duplicateCount) { this.duplicateCount = duplicateCount; }

        public String getDuplicateStrategy() { return duplicateStrategy; }
        public void setDuplicateStrategy(String duplicateStrategy) { this.duplicateStrategy = duplicateStrategy; }

        public List<Map<String, Object>> getPreviewRows() { return previewRows; }
        public void setPreviewRows(List<Map<String, Object>> previewRows) { this.previewRows = previewRows; }

        public List<Map<String, Object>> getErrors() { return errors; }
        public void setErrors(List<Map<String, Object>> errors) { this.errors = errors; }
    }

    public static class ImportSummaryResponse {
        private int totalProcessed;
        private int importedCount;
        private int skippedCount;
        private int failedCount;
        private List<Map<String, Object>> errors = new ArrayList<>();

        public int getTotalProcessed() { return totalProcessed; }
        public void setTotalProcessed(int totalProcessed) { this.totalProcessed = totalProcessed; }

        public int getImportedCount() { return importedCount; }
        public void setImportedCount(int importedCount) { this.importedCount = importedCount; }

        public int getSkippedCount() { return skippedCount; }
        public void setSkippedCount(int skippedCount) { this.skippedCount = skippedCount; }

        public int getFailedCount() { return failedCount; }
        public void setFailedCount(int failedCount) { this.failedCount = failedCount; }

        public List<Map<String, Object>> getErrors() { return errors; }
        public void setErrors(List<Map<String, Object>> errors) { this.errors = errors; }
    }

    public static class FilterOptionsResponse {
        private List<String> subjects = new ArrayList<>();
        private List<String> topics = new ArrayList<>();

        public FilterOptionsResponse(List<String> subjects, List<String> topics) {
            this.subjects = subjects;
            this.topics = topics;
        }

        public List<String> getSubjects() { return subjects; }
        public List<String> getTopics() { return topics; }
    }
}
