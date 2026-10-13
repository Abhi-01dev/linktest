package com.linktest.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 128)
    private String category;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "instructor_name", length = 255)
    private String instructorName;

    @Column(name = "instructor_id", length = 128)
    private String instructorId;

    @Column(name = "status", length = 64)
    private String status;

    @Column(name = "published")
    private Boolean published;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public Course() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "course-" + java.util.UUID.randomUUID().toString();
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (published == null) published = false;
        if (status == null) status = "draft";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }

    public String getInstructorId() { return instructorId; }
    public void setInstructorId(String instructorId) { this.instructorId = instructorId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getPublished() { return published; }
    public void setPublished(Boolean published) { this.published = published; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
