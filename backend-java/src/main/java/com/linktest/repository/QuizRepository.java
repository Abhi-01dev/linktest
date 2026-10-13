package com.linktest.repository;

import com.linktest.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, String> {

    List<Quiz> findByCourseId(String courseId);

    List<Quiz> findByTeacherIdOrderByCreatedAtDesc(String teacherId);
}
