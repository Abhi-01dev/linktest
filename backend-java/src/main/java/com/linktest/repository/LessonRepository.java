package com.linktest.repository;

import com.linktest.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, String> {

    List<Lesson> findByCourseIdOrderByPositionAsc(String courseId);
}
