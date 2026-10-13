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
@Table(name = "mock_test_questions")
public class MockTestQuestion {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "test_id", nullable = false, length = 128)
    private String testId;

    @Column(name = "section_id", length = 128)
    private String sectionId;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "question_type", length = 64)
    private String questionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", columnDefinition = "jsonb")
    private List<Object> options = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answer_key", columnDefinition = "jsonb")
    private Map<String, Object> answerKey = new HashMap<>();

    @Column(name = "marks", precision = 6, scale = 2)
    private BigDecimal marks;

    @Column(name = "negative_marks", precision = 6, scale = 2)
    private BigDecimal negativeMarks;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "topic", length = 255)
    private String topic;

    @Column(name = "difficulty", length = 64)
    private String difficulty;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "case_passage", columnDefinition = "TEXT")
    private String casePassage;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public MockTestQuestion() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "q-" + java.util.UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (questionType == null) {
            questionType = "mcq_single";
        }
        if (marks == null) {
            marks = new BigDecimal("4.00");
        }
        if (negativeMarks == null) {
            negativeMarks = new BigDecimal("1.00");
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTestId() { return testId; }
    public void setTestId(String testId) { this.testId = testId; }

    public String getSectionId() { return sectionId; }
    public void setSectionId(String sectionId) { this.sectionId = sectionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }

    public List<Object> getOptions() { return options; }
    public void setOptions(List<Object> options) { this.options = options; }

    public Map<String, Object> getAnswerKey() { return answerKey; }
    public void setAnswerKey(Map<String, Object> answerKey) { this.answerKey = answerKey; }

    public BigDecimal getMarks() { return marks; }
    public void setMarks(BigDecimal marks) { this.marks = marks; }

    public BigDecimal getNegativeMarks() { return negativeMarks; }
    public void setNegativeMarks(BigDecimal negativeMarks) { this.negativeMarks = negativeMarks; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    public String getCasePassage() { return casePassage; }
    public void setCasePassage(String casePassage) { this.casePassage = casePassage; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
