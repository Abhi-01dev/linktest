package com.linktest.repository;

import com.linktest.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, String> {

    List<QuizAttempt> findByUserIdOrderBySubmittedAtDesc(String userId);

    List<QuizAttempt> findByQuizIdOrderBySubmittedAtDesc(String quizId);
}
