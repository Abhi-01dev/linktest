package com.linktest.repository;

import com.linktest.entity.BatchEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface BatchEnrollmentRepository extends JpaRepository<BatchEnrollment, String> {

    List<BatchEnrollment> findByBatchId(String batchId);

    Optional<BatchEnrollment> findByBatchIdAndStudentId(String batchId, String studentId);

    boolean existsByBatchIdAndStudentId(String batchId, String studentId);

    void deleteByBatchIdAndStudentId(String batchId, String studentId);

    long countByBatchId(String batchId);

    @Query("SELECT u.id as id, u.fullName as full_name, u.email as email, be.enrolledAt as enrolled_at, be.status as status " +
           "FROM BatchEnrollment be JOIN User u ON be.studentId = u.id " +
           "WHERE be.batchId = :batchId")
    List<Map<String, Object>> findStudentDetailsByBatchId(@Param("batchId") String batchId);
}
