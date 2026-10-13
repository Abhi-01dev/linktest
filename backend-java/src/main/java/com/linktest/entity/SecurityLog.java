package com.linktest.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "security_logs")
public class SecurityLog {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "severity", nullable = false)
    private String severity = "INFO";

    @Column(name = "user_id")
    private String userId;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "details")
    private String details;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata = "{}";

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public SecurityLog() {
    }

    public SecurityLog(String id, String eventType, String severity, String userId, String userEmail, String ipAddress, String userAgent, String details, String metadata) {
        this.id = id;
        this.eventType = eventType;
        this.severity = severity != null ? severity : "INFO";
        this.userId = userId;
        this.userEmail = userEmail;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.details = details;
        this.metadata = metadata != null ? metadata : "{}";
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
