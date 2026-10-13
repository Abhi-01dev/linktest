package com.linktest.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "lessons")
public class Lesson {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "course_id", nullable = false, length = 128)
    private String courseId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "position")
    private Integer position;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public Lesson() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "lesson-" + java.util.UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (position == null) {
            position = 1;
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
