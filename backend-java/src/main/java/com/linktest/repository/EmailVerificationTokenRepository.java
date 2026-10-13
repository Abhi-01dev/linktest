package com.linktest.repository;

import com.linktest.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, String> {
    Optional<EmailVerificationToken> findTopByUserIdOrderByCreatedAtDesc(String userId);
    void deleteByUserId(String userId);
}
