package com.linktest.repository;

import com.linktest.entity.MockTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MockTestRepository extends JpaRepository<MockTest, String> {

    @Query("SELECT m FROM MockTest m WHERE " +
           "(:status IS NULL OR :status = '' OR m.status = :status) AND " +
           "(:subject IS NULL OR :subject = '' OR LOWER(m.subject) = LOWER(:subject)) AND " +
           "(:difficulty IS NULL OR :difficulty = '' OR LOWER(m.difficulty) = LOWER(:difficulty)) AND " +
           "(:category IS NULL OR :category = '' OR LOWER(m.category) = LOWER(:category)) AND " +
           "(:createdBy IS NULL OR :createdBy = '' OR m.createdBy = :createdBy) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY m.createdAt DESC")
    List<MockTest> findAllWithFilters(
            @Param("status") String status,
            @Param("subject") String subject,
            @Param("difficulty") String difficulty,
            @Param("category") String category,
            @Param("createdBy") String createdBy,
            @Param("search") String search
    );

    List<MockTest> findByBatchId(String batchId);

    List<MockTest> findByStatusOrderByCreatedAtDesc(String status);
}
