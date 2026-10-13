package com.linktest.repository;

import com.linktest.entity.SecurityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface SecurityLogRepository extends JpaRepository<SecurityLog, String>, JpaSpecificationExecutor<SecurityLog> {
}
