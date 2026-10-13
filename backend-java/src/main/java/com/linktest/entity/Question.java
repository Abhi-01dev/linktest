package com.linktest.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "quiz_id", nullable = false, length = 128)
    private String quizId;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", columnDefinition = "jsonb")
    private List<String> options = new ArrayList<>();

    @Column(name = "correct_option_index")
    private Integer correctOptionIndex;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "position")
    private Integer position;

    public Question() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "quest-" + java.util.UUID.randomUUID().toString();
        }
        if (position == null) {
            position = 1;
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public Integer getCorrectOptionIndex() { return correctOptionIndex; }
    public void setCorrectOptionIndex(Integer correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
