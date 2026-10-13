package com.linktest.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "actor_id")
    private String actorId;

    @Column(name = "actor_email")
    private String actorEmail;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "resource_type")
    private String resourceType;

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "summary")
    private String summary;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public AuditLog() {
    }

    public AuditLog(String id, String actorId, String actorEmail, String action, String resourceType, String resourceId, String summary, String ipAddress) {
        this.id = id;
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.summary = summary;
        this.ipAddress = ipAddress;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
