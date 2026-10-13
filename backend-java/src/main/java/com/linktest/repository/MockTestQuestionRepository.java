package com.linktest.repository;

import com.linktest.entity.MockTestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MockTestQuestionRepository extends JpaRepository<MockTestQuestion, String> {

    List<MockTestQuestion> findByTestIdOrderByOrderIndexAsc(String testId);

    void deleteByTestId(String testId);
}
