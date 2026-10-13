package com.linktest.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "mock_test_proctoring_events")
public class MockTestProctoringEvent {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "attempt_id", nullable = false, length = 128)
    private String attemptId;

    @Column(name = "event_type", nullable = false, length = 128)
    private String eventType;

    @Column(name = "severity", length = 32)
    private String severity;

    @Column(name = "confidence", precision = 4, scale = 2)
    private BigDecimal confidence;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Column(name = "review_status", length = 32)
    private String reviewStatus;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "reviewed_by", length = 128)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "client_timestamp")
    private OffsetDateTime clientTimestamp;

    @Column(name = "server_timestamp")
    private OffsetDateTime serverTimestamp;

    public MockTestProctoringEvent() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = "evt-" + java.util.UUID.randomUUID().toString();
        }
        if (serverTimestamp == null) {
            serverTimestamp = OffsetDateTime.now();
        }
        if (clientTimestamp == null) {
            clientTimestamp = serverTimestamp;
        }
        if (reviewStatus == null) {
            reviewStatus = "pending";
        }
        if (severity == null) {
            severity = "warning";
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAttemptId() { return attemptId; }
    public void setAttemptId(String attemptId) { this.attemptId = attemptId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public String getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public OffsetDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(OffsetDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public OffsetDateTime getClientTimestamp() { return clientTimestamp; }
    public void setClientTimestamp(OffsetDateTime clientTimestamp) { this.clientTimestamp = clientTimestamp; }

    public OffsetDateTime getServerTimestamp() { return serverTimestamp; }
    public void setServerTimestamp(OffsetDateTime serverTimestamp) { this.serverTimestamp = serverTimestamp; }
}
