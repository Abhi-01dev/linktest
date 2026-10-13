package com.linktest.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "mock_test_responses")
public class MockTestResponse {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "attempt_id", nullable = false, length = 128)
    private String attemptId;

    @Column(name = "question_id", nullable = false, length = 128)
    private String questionId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_data", columnDefinition = "jsonb")
    private Map<String, Object> responseData = new HashMap<>();

    @Column(name = "is_marked_for_review")
    private Boolean isMarkedForReview;

    @Column(name = "is_visited")
    private Boolean isVisited;

    @Column(name = "score_awarded", precision = 6, scale = 2)
    private BigDecimal scoreAwarded;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "evaluation_comment", columnDefinition = "TEXT")
    private String evaluationComment;

    @Column(name = "evaluated_by", length = 128)
    private String evaluatedBy;

    @Column(name = "evaluated_at")
    private OffsetDateTime evaluatedAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public MockTestResponse() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "resp-" + java.util.UUID.randomUUID().toString();
        }
        if (updatedAt == null) {
            updatedAt = OffsetDateTime.now();
        }
        if (isMarkedForReview == null) isMarkedForReview = false;
        if (isVisited == null) isVisited = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAttemptId() { return attemptId; }
    public void setAttemptId(String attemptId) { this.attemptId = attemptId; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public Map<String, Object> getResponseData() { return responseData; }
    public void setResponseData(Map<String, Object> responseData) { this.responseData = responseData; }

    public Boolean getIsMarkedForReview() { return isMarkedForReview; }
    public void setIsMarkedForReview(Boolean isMarkedForReview) { this.isMarkedForReview = isMarkedForReview; }

    public Boolean getIsVisited() { return isVisited; }
    public void setIsVisited(Boolean isVisited) { this.isVisited = isVisited; }

    public BigDecimal getScoreAwarded() { return scoreAwarded; }
    public void setScoreAwarded(BigDecimal scoreAwarded) { this.scoreAwarded = scoreAwarded; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public String getEvaluationComment() { return evaluationComment; }
    public void setEvaluationComment(String evaluationComment) { this.evaluationComment = evaluationComment; }

    public String getEvaluatedBy() { return evaluatedBy; }
    public void setEvaluatedBy(String evaluatedBy) { this.evaluatedBy = evaluatedBy; }

    public OffsetDateTime getEvaluatedAt() { return evaluatedAt; }
    public void setEvaluatedAt(OffsetDateTime evaluatedAt) { this.evaluatedAt = evaluatedAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
