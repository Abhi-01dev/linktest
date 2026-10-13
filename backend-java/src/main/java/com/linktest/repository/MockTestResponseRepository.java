package com.linktest.repository;

import com.linktest.entity.MockTestResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MockTestResponseRepository extends JpaRepository<MockTestResponse, String> {

    List<MockTestResponse> findByAttemptId(String attemptId);

    Optional<MockTestResponse> findByAttemptIdAndQuestionId(String attemptId, String questionId);

    void deleteByAttemptId(String attemptId);
}
