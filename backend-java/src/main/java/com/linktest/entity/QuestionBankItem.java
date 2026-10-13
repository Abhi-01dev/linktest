package com.linktest.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "question_bank")
public class QuestionBankItem {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", nullable = false, columnDefinition = "jsonb")
    private List<String> options = new ArrayList<>();

    @Column(name = "correct_option_index", nullable = false)
    private Integer correctOptionIndex;

    @Column(name = "correct_answer", nullable = false, length = 32)
    private String correctAnswer;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "topic", nullable = false, length = 255)
    private String topic;

    @Column(name = "difficulty", nullable = false, length = 64)
    private String difficulty;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "marks", nullable = false, precision = 6, scale = 2)
    private BigDecimal marks;

    @Column(name = "negative_marks", nullable = false, precision = 6, scale = 2)
    private BigDecimal negativeMarks;

    @Column(name = "created_by", length = 128)
    private String createdBy;

    @Column(name = "subject_id", length = 128)
    private String subjectId;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public QuestionBankItem() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "qb-" + java.util.UUID.randomUUID().toString();
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (marks == null) marks = new BigDecimal("4.00");
        if (negativeMarks == null) negativeMarks = new BigDecimal("1.00");
        if (difficulty == null) difficulty = "MEDIUM";
        if (correctOptionIndex == null) correctOptionIndex = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public Integer getCorrectOptionIndex() { return correctOptionIndex; }
    public void setCorrectOptionIndex(Integer correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

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

    public BigDecimal getNegativeMarks() { return negativeMarks; }
    public void setNegativeMarks(BigDecimal negativeMarks) { this.negativeMarks = negativeMarks; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
