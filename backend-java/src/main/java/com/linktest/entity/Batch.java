package com.linktest.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "batches")
public class Batch {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "code", length = 64)
    private String code;

    @Column(name = "class_id", length = 128)
    private String classId;

    @Column(name = "course_id", length = 128)
    private String courseId;

    @Column(name = "class_teacher_id", length = 128)
    private String classTeacherId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "status", length = 32)
    private String status;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public Batch() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "batch-" + java.util.UUID.randomUUID().toString();
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (capacity == null) capacity = 40;
        if (status == null) status = "Active";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getClassTeacherId() { return classTeacherId; }
    public void setClassTeacherId(String classTeacherId) { this.classTeacherId = classTeacherId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
