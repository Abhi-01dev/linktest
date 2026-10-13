package com.linktest.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "batch_teachers")
public class BatchTeacher {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "batch_id", nullable = false, length = 128)
    private String batchId;

    @Column(name = "teacher_id", nullable = false, length = 128)
    private String teacherId;

    @Column(name = "assigned_by", length = 128)
    private String assignedBy;

    @Column(name = "assigned_at")
    private OffsetDateTime assignedAt;

    public BatchTeacher() {}

    public BatchTeacher(String batchId, String teacherId, String assignedBy) {
        this.id = "bt-" + java.util.UUID.randomUUID().toString();
        this.batchId = batchId;
        this.teacherId = teacherId;
        this.assignedBy = assignedBy;
        this.assignedAt = OffsetDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "bt-" + java.util.UUID.randomUUID().toString();
        }
        if (assignedAt == null) {
            assignedAt = OffsetDateTime.now();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }

    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }

    public OffsetDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(OffsetDateTime assignedAt) { this.assignedAt = assignedAt; }
}
