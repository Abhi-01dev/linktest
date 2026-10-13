package com.linktest.repository;

import com.linktest.entity.BatchTeacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface BatchTeacherRepository extends JpaRepository<BatchTeacher, String> {

    List<BatchTeacher> findByBatchId(String batchId);

    Optional<BatchTeacher> findByBatchIdAndTeacherId(String batchId, String teacherId);

    boolean existsByBatchIdAndTeacherId(String batchId, String teacherId);

    void deleteByBatchIdAndTeacherId(String batchId, String teacherId);

    @Query("SELECT u.id as id, u.fullName as full_name, u.email as email, bt.assignedAt as assigned_at " +
           "FROM BatchTeacher bt JOIN User u ON bt.teacherId = u.id " +
           "WHERE bt.batchId = :batchId")
    List<Map<String, Object>> findTeacherDetailsByBatchId(@Param("batchId") String batchId);
}
