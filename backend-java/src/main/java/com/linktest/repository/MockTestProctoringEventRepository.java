package com.linktest.repository;

import com.linktest.entity.MockTestProctoringEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MockTestProctoringEventRepository extends JpaRepository<MockTestProctoringEvent, String> {

    List<MockTestProctoringEvent> findByAttemptIdOrderByServerTimestampAsc(String attemptId);

    long countByAttemptId(String attemptId);
}
