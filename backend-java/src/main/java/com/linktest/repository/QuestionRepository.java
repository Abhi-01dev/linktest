package com.linktest.repository;

import com.linktest.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {

    List<Question> findByQuizIdOrderByPositionAsc(String quizId);
}
