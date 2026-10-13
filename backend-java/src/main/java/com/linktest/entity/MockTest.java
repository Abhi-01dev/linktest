package com.linktest.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "mock_tests")
public class MockTest {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "topic", length = 255)
    private String topic;

    @Column(name = "difficulty", length = 64)
    private String difficulty;

    @Column(name = "category", length = 64)
    private String category;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    private List<String> tags = new ArrayList<>();

    @Column(name = "created_by", length = 128)
    private String createdBy;

    @Column(name = "class_id", length = 128)
    private String classId;

    @Column(name = "batch_id", length = 128)
    private String batchId;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "scheduled_start")
    private OffsetDateTime scheduledStart;

    @Column(name = "scheduled_end")
    private OffsetDateTime scheduledEnd;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "total_marks", precision = 6, scale = 2)
    private BigDecimal totalMarks;

    @Column(name = "pass_percentage", precision = 5, scale = 2)
    private BigDecimal passPercentage;

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    @Column(name = "randomize_questions")
    private Boolean randomizeQuestions;

    @Column(name = "randomize_options")
    private Boolean randomizeOptions;

    @Column(name = "negative_marking")
    private Boolean negativeMarking;

    @Column(name = "negative_mark_penalty", precision = 5, scale = 2)
    private BigDecimal negativeMarkPenalty;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "proctoring_config", columnDefinition = "jsonb")
    private Map<String, Object> proctoringConfig = new HashMap<>();

    @Column(name = "status", length = 32)
    private String status;

    @Column(name = "results_published")
    private Boolean resultsPublished;

    @Column(name = "allow_instant_result")
    private Boolean allowInstantResult;

    @Column(name = "show_explanations")
    private Boolean showExplanations;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public MockTest() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "mock-" + java.util.UUID.randomUUID().toString();
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (durationMinutes == null) durationMinutes = 60;
        if (status == null) status = "draft";
        if (maxAttempts == null) maxAttempts = 1;
        if (passPercentage == null) passPercentage = new BigDecimal("40.00");
        if (totalMarks == null) totalMarks = new BigDecimal("100.00");
        if (randomizeQuestions == null) randomizeQuestions = false;
        if (randomizeOptions == null) randomizeOptions = false;
        if (negativeMarking == null) negativeMarking = false;
        if (negativeMarkPenalty == null) negativeMarkPenalty = new BigDecimal("1.00");
        if (resultsPublished == null) resultsPublished = false;
        if (allowInstantResult == null) allowInstantResult = true;
        if (showExplanations == null) showExplanations = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public OffsetDateTime getScheduledStart() { return scheduledStart; }
    public void setScheduledStart(OffsetDateTime scheduledStart) { this.scheduledStart = scheduledStart; }

    public OffsetDateTime getScheduledEnd() { return scheduledEnd; }
    public void setScheduledEnd(OffsetDateTime scheduledEnd) { this.scheduledEnd = scheduledEnd; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public BigDecimal getTotalMarks() { return totalMarks; }
    public void setTotalMarks(BigDecimal totalMarks) { this.totalMarks = totalMarks; }

    public BigDecimal getPassPercentage() { return passPercentage; }
    public void setPassPercentage(BigDecimal passPercentage) { this.passPercentage = passPercentage; }

    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }

    public Boolean getRandomizeQuestions() { return randomizeQuestions; }
    public void setRandomizeQuestions(Boolean randomizeQuestions) { this.randomizeQuestions = randomizeQuestions; }

    public Boolean getRandomizeOptions() { return randomizeOptions; }
    public void setRandomizeOptions(Boolean randomizeOptions) { this.randomizeOptions = randomizeOptions; }

    public Boolean getNegativeMarking() { return negativeMarking; }
    public void setNegativeMarking(Boolean negativeMarking) { this.negativeMarking = negativeMarking; }

    public BigDecimal getNegativeMarkPenalty() { return negativeMarkPenalty; }
    public void setNegativeMarkPenalty(BigDecimal negativeMarkPenalty) { this.negativeMarkPenalty = negativeMarkPenalty; }

    public Map<String, Object> getProctoringConfig() { return proctoringConfig; }
    public void setProctoringConfig(Map<String, Object> proctoringConfig) { this.proctoringConfig = proctoringConfig; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getResultsPublished() { return resultsPublished; }
    public void setResultsPublished(Boolean resultsPublished) { this.resultsPublished = resultsPublished; }

    public Boolean getAllowInstantResult() { return allowInstantResult; }
    public void setAllowInstantResult(Boolean allowInstantResult) { this.allowInstantResult = allowInstantResult; }

    public Boolean getShowExplanations() { return showExplanations; }
    public void setShowExplanations(Boolean showExplanations) { this.showExplanations = showExplanations; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
