package com.linktest.repository;

import com.linktest.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String>, JpaSpecificationExecutor<AuditLog> {
}
