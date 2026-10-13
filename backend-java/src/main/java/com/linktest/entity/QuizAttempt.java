package com.linktest.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "user_id", nullable = false, length = 128)
    private String userId;

    @Column(name = "quiz_id", nullable = false, length = 128)
    private String quizId;

    @Column(name = "score")
    private Integer score;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    public QuizAttempt() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "qa-" + java.util.UUID.randomUUID().toString();
        }
        if (submittedAt == null) {
            submittedAt = OffsetDateTime.now();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(OffsetDateTime submittedAt) { this.submittedAt = submittedAt; }
}
