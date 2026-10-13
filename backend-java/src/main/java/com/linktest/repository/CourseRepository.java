package com.linktest.repository;

import com.linktest.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {

    List<Course> findByPublishedTrueOrderByCreatedAtDesc();

    List<Course> findByInstructorIdOrderByCreatedAtDesc(String instructorId);
}
