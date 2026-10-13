package com.linktest.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "batch_enrollments")
public class BatchEnrollment {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "batch_id", nullable = false, length = 128)
    private String batchId;

    @Column(name = "student_id", nullable = false, length = 128)
    private String studentId;

    @Column(name = "enrolled_by", length = 128)
    private String enrolledBy;

    @Column(name = "status", length = 32)
    private String status;

    @Column(name = "enrolled_at")
    private OffsetDateTime enrolledAt;

    public BatchEnrollment() {}

    public BatchEnrollment(String batchId, String studentId, String enrolledBy) {
        this.id = "be-" + java.util.UUID.randomUUID().toString();
        this.batchId = batchId;
        this.studentId = studentId;
        this.enrolledBy = enrolledBy;
        this.status = "Active";
        this.enrolledAt = OffsetDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "be-" + java.util.UUID.randomUUID().toString();
        }
        if (enrolledAt == null) {
            enrolledAt = OffsetDateTime.now();
        }
        if (status == null) {
            status = "Active";
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getEnrolledBy() { return enrolledBy; }
    public void setEnrolledBy(String enrolledBy) { this.enrolledBy = enrolledBy; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(OffsetDateTime enrolledAt) { this.enrolledAt = enrolledAt; }
}
