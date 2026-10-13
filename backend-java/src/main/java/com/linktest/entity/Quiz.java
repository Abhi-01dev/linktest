package com.linktest.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "quizzes")
public class Quiz {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "teacher_id", length = 128)
    private String teacherId;

    @Column(name = "status", length = 64)
    private String status;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "pass_percentage")
    private Integer passPercentage;

    @Column(name = "results_published")
    private Boolean resultsPublished;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public Quiz() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "quiz-" + java.util.UUID.randomUUID().toString();
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = "draft";
        if (durationMinutes == null) durationMinutes = 30;
        if (passPercentage == null) passPercentage = 60;
        if (resultsPublished == null) resultsPublished = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Integer getPassPercentage() { return passPercentage; }
    public void setPassPercentage(Integer passPercentage) { this.passPercentage = passPercentage; }

    public Boolean getResultsPublished() { return resultsPublished; }
    public void setResultsPublished(Boolean resultsPublished) { this.resultsPublished = resultsPublished; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
