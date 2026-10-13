package com.linktest.repository;

import com.linktest.entity.MockTestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MockTestAttemptRepository extends JpaRepository<MockTestAttempt, String> {

    List<MockTestAttempt> findByStudentIdOrderByStartedAtDesc(String studentId);

    List<MockTestAttempt> findByTestIdOrderByStartedAtDesc(String testId);

    List<MockTestAttempt> findByStudentIdAndTestIdOrderByStartedAtDesc(String studentId, String testId);

    @Query("SELECT a FROM MockTestAttempt a WHERE a.studentId = :studentId AND a.testId = :testId AND a.status = 'in_progress' ORDER BY a.startedAt DESC")
    List<MockTestAttempt> findActiveAttempts(@Param("studentId") String studentId, @Param("testId") String testId);

    long countByStudentIdAndTestId(String studentId, String testId);
}
