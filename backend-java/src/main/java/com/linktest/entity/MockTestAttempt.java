package com.linktest.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "mock_test_attempts")
public class MockTestAttempt {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "test_id", nullable = false, length = 128)
    private String testId;

    @Column(name = "student_id", nullable = false, length = 128)
    private String studentId;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "status", length = 32)
    private String status;

    @Column(name = "total_score", precision = 6, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "max_score", precision = 6, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "passed")
    private Boolean passed;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "incorrect_count")
    private Integer incorrectCount;

    @Column(name = "unanswered_count")
    private Integer unansweredCount;

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;

    @Column(name = "warning_count")
    private Integer warningCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "test_snapshot", columnDefinition = "jsonb")
    private Map<String, Object> testSnapshot = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "proctoring_summary", columnDefinition = "jsonb")
    private Map<String, Object> proctoringSummary = new HashMap<>();

    @Column(name = "evaluator_remarks", columnDefinition = "TEXT")
    private String evaluatorRemarks;

    @Column(name = "evaluated_by", length = 128)
    private String evaluatedBy;

    @Column(name = "evaluated_at")
    private OffsetDateTime evaluatedAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public MockTestAttempt() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "attempt-" + java.util.UUID.randomUUID().toString();
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (startedAt == null) startedAt = now;
        if (status == null) status = "in_progress";
        if (warningCount == null) warningCount = 0;
        if (correctCount == null) correctCount = 0;
        if (incorrectCount == null) incorrectCount = 0;
        if (unansweredCount == null) unansweredCount = 0;
        if (totalScore == null) totalScore = BigDecimal.ZERO;
        if (timeSpentSeconds == null) timeSpentSeconds = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTestId() { return testId; }
    public void setTestId(String testId) { this.testId = testId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(OffsetDateTime submittedAt) { this.submittedAt = submittedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getTotalScore() { return totalScore; }
    public void setTotalScore(BigDecimal totalScore) { this.totalScore = totalScore; }

    public BigDecimal getMaxScore() { return maxScore; }
    public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }

    public BigDecimal getPercentage() { return percentage; }
    public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public Integer getCorrectCount() { return correctCount; }
    public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }

    public Integer getIncorrectCount() { return incorrectCount; }
    public void setIncorrectCount(Integer incorrectCount) { this.incorrectCount = incorrectCount; }

    public Integer getUnansweredCount() { return unansweredCount; }
    public void setUnansweredCount(Integer unansweredCount) { this.unansweredCount = unansweredCount; }

    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }

    public Integer getWarningCount() { return warningCount; }
    public void setWarningCount(Integer warningCount) { this.warningCount = warningCount; }

    public Map<String, Object> getTestSnapshot() { return testSnapshot; }
    public void setTestSnapshot(Map<String, Object> testSnapshot) { this.testSnapshot = testSnapshot; }

    public Map<String, Object> getProctoringSummary() { return proctoringSummary; }
    public void setProctoringSummary(Map<String, Object> proctoringSummary) { this.proctoringSummary = proctoringSummary; }

    public String getEvaluatorRemarks() { return evaluatorRemarks; }
    public void setEvaluatorRemarks(String evaluatorRemarks) { this.evaluatorRemarks = evaluatorRemarks; }

    public String getEvaluatedBy() { return evaluatedBy; }
    public void setEvaluatedBy(String evaluatedBy) { this.evaluatedBy = evaluatedBy; }

    public OffsetDateTime getEvaluatedAt() { return evaluatedAt; }
    public void setEvaluatedAt(OffsetDateTime evaluatedAt) { this.evaluatedAt = evaluatedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
