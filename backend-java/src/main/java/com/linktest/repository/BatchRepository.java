package com.linktest.repository;

import com.linktest.entity.Batch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batch, String> {

    Optional<Batch> findByCode(String code);

    @Query("SELECT b FROM Batch b WHERE " +
           "(:search IS NULL OR :search = '' OR LOWER(b.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(b.code) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR b.status = :status) AND " +
           "(:courseId IS NULL OR :courseId = '' OR b.courseId = :courseId) " +
           "ORDER BY b.createdAt DESC")
    List<Batch> findAllWithFilters(
            @Param("search") String search,
            @Param("status") String status,
            @Param("courseId") String courseId
    );

    @Query("SELECT b FROM Batch b JOIN BatchTeacher bt ON b.id = bt.batchId WHERE bt.teacherId = :teacherId ORDER BY b.createdAt DESC")
    List<Batch> findBatchesForTeacher(@Param("teacherId") String teacherId);

    @Query("SELECT b FROM Batch b JOIN BatchEnrollment be ON b.id = be.batchId WHERE be.studentId = :studentId ORDER BY b.createdAt DESC")
    List<Batch> findBatchesForStudent(@Param("studentId") String studentId);
}
