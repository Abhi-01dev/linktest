package com.linktest.service;

import com.linktest.entity.AuditLog;
import com.linktest.entity.SecurityLog;
import com.linktest.repository.AuditLogRepository;
import com.linktest.repository.SecurityLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class LoggingService {

    private static final Logger log = LoggerFactory.getLogger(LoggingService.class);

    private final AuditLogRepository auditLogRepository;
    private final SecurityLogRepository securityLogRepository;

    public LoggingService(AuditLogRepository auditLogRepository, SecurityLogRepository securityLogRepository) {
        this.auditLogRepository = auditLogRepository;
        this.securityLogRepository = securityLogRepository;
    }

    public void logAudit(String actorId, String action, String resourceType, String resourceId, java.util.Map<String, ?> metadata) {
        String summary = metadata != null ? metadata.toString() : "";
        logAudit(actorId, null, action, resourceType, resourceId, summary, null);
    }

    public void logAudit(String actorId, String action, String resourceType, String resourceId, String summary) {
        logAudit(actorId, null, action, resourceType, resourceId, summary, null);
    }

    public void logAudit(String actorId, String actorEmail, String action, String resourceType, String resourceId, String summary, String ipAddress) {
        try {
            AuditLog entry = new AuditLog(
                    UUID.randomUUID().toString(),
                    actorId,
                    actorEmail,
                    action != null ? action : "UNKNOWN_ACTION",
                    resourceType,
                    resourceId,
                    summary,
                    ipAddress
            );
            auditLogRepository.save(entry);
        } catch (Exception ex) {
            log.warn("Failed to persist audit log: {}", ex.getMessage());
        }
    }

    public void logSecurity(String eventType, String severity, String userId, String userEmail, String ipAddress, String userAgent, String details, String metadataJson) {
        try {
            SecurityLog entry = new SecurityLog(
                    UUID.randomUUID().toString(),
                    eventType != null ? eventType : "SECURITY_EVENT",
                    severity != null ? severity : "INFO",
                    userId,
                    userEmail,
                    ipAddress,
                    userAgent,
                    details,
                    metadataJson != null ? metadataJson : "{}"
            );
            securityLogRepository.save(entry);
        } catch (Exception ex) {
            log.warn("Failed to persist security log: {}", ex.getMessage());
        }
    }
}
