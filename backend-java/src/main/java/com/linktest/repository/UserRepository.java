package com.linktest.repository;

import com.linktest.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(String role);

    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR :role = '' OR u.role = :role) AND " +
           "(:status IS NULL OR :status = '' OR u.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findUsersWithFilters(
            @Param("role") String role,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND " +
           "(:search IS NULL OR :search = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<User> searchStudents(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND " +
           "(:search IS NULL OR :search = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<User> searchStudents(@Param("search") String search);
}
