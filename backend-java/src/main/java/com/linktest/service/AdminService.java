package com.linktest.service;

import com.linktest.entity.*;
import com.linktest.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final MockTestRepository mockTestRepository;
    private final MockTestAttemptRepository mockTestAttemptRepository;
    private final AuditLogRepository auditLogRepository;
    private final SecurityLogRepository securityLogRepository;
    private final CsvParserService csvParserService;
    private final LoggingService loggingService;

    public AdminService(
            UserRepository userRepository,
            BatchRepository batchRepository,
            MockTestRepository mockTestRepository,
            MockTestAttemptRepository mockTestAttemptRepository,
            AuditLogRepository auditLogRepository,
            SecurityLogRepository securityLogRepository,
            CsvParserService csvParserService,
            LoggingService loggingService) {
        this.userRepository = userRepository;
        this.batchRepository = batchRepository;
        this.mockTestRepository = mockTestRepository;
        this.mockTestAttemptRepository = mockTestAttemptRepository;
        this.auditLogRepository = auditLogRepository;
        this.securityLogRepository = securityLogRepository;
        this.csvParserService = csvParserService;
        this.loggingService = loggingService;
    }

    public Map<String, Object> getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.countByRole("STUDENT");
        long totalTeachers = userRepository.countByRole("TEACHER");
        long totalBatches = batchRepository.count();
        long totalMockTests = mockTestRepository.count();
        long totalAttempts = mockTestAttemptRepository.count();

        List<MockTestAttempt> attempts = mockTestAttemptRepository.findAll();
        BigDecimal sumScore = BigDecimal.ZERO;
        int evaluatedCount = 0;
        int passedCount = 0;

        for (MockTestAttempt a : attempts) {
            if ("evaluated".equalsIgnoreCase(a.getStatus())) {
                evaluatedCount++;
                if (a.getTotalScore() != null) sumScore = sumScore.add(a.getTotalScore());
                if (Boolean.TRUE.equals(a.getPassed())) passedCount++;
            }
        }

        BigDecimal avgScore = evaluatedCount > 0
                ? sumScore.divide(BigDecimal.valueOf(evaluatedCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal passPct = evaluatedCount > 0
                ? BigDecimal.valueOf(passedCount * 100.0 / evaluatedCount).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total_users", totalUsers);
        stats.put("total_students", totalStudents);
        stats.put("total_teachers", totalTeachers);
        stats.put("total_batches", totalBatches);
        stats.put("total_tests", totalMockTests);
        stats.put("total_attempts", totalAttempts);
        stats.put("average_score", avgScore);
        stats.put("pass_percentage", passPct);

        return stats;
    }

    public Page<User> getUsers(String role, String status, String search, int page, int limit) {
        PageRequest pr = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository.findUsersWithFilters(role, status, search, pr);
    }

    @Transactional
    public User updateUserStatus(String userId, String status, User actor) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) throw new IllegalArgumentException("User not found.");

        user.setStatus(status);
        User saved = userRepository.save(user);

        loggingService.logAudit(
                actor.getId(),
                "USER_STATUS_UPDATED",
                "user",
                userId,
                Map.of("newStatus", status, "email", user.getEmail())
        );

        return saved;
    }

    public Page<AuditLog> getAuditLogs(String action, String resourceType, Instant startDate, Instant endDate, String search, int page, int limit) {
        PageRequest pr = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        org.springframework.data.jpa.domain.Specification<AuditLog> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (action != null && !action.isBlank() && !"ALL".equalsIgnoreCase(action)) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (resourceType != null && !resourceType.isBlank() && !"ALL".equalsIgnoreCase(resourceType)) {
                predicates.add(cb.equal(root.get("resourceType"), resourceType));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                jakarta.persistence.criteria.Predicate sumP = cb.like(cb.lower(root.get("summary")), pattern);
                jakarta.persistence.criteria.Predicate emailP = cb.like(cb.lower(root.get("actorEmail")), pattern);
                predicates.add(cb.or(sumP, emailP));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return auditLogRepository.findAll(spec, pr);
    }

    public Page<SecurityLog> getSecurityLogs(String eventType, String severity, Instant startDate, Instant endDate, String search, int page, int limit) {
        PageRequest pr = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        org.springframework.data.jpa.domain.Specification<SecurityLog> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (eventType != null && !eventType.isBlank() && !"ALL".equalsIgnoreCase(eventType)) {
                predicates.add(cb.equal(root.get("eventType"), eventType));
            }
            if (severity != null && !severity.isBlank() && !"ALL".equalsIgnoreCase(severity)) {
                predicates.add(cb.equal(root.get("severity"), severity));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                jakarta.persistence.criteria.Predicate detP = cb.like(cb.lower(root.get("details")), pattern);
                jakarta.persistence.criteria.Predicate emailP = cb.like(cb.lower(root.get("userEmail")), pattern);
                predicates.add(cb.or(detP, emailP));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return securityLogRepository.findAll(spec, pr);
    }

    public Map<String, Object> getReportsOverview() {
        List<MockTestAttempt> attempts = mockTestAttemptRepository.findAll();
        int total = attempts.size();

        BigDecimal sumScore = BigDecimal.ZERO;
        int passedCount = 0;
        int failedCount = 0;

        List<Map<String, Object>> recentAttempts = new ArrayList<>();

        for (MockTestAttempt a : attempts) {
            if ("evaluated".equalsIgnoreCase(a.getStatus())) {
                if (a.getTotalScore() != null) sumScore = sumScore.add(a.getTotalScore());
                if (Boolean.TRUE.equals(a.getPassed())) {
                    passedCount++;
                } else {
                    failedCount++;
                }

                if (recentAttempts.size() < 20) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", a.getId());
                    item.put("test_id", a.getTestId());
                    item.put("student_id", a.getStudentId());
                    item.put("total_score", a.getTotalScore());
                    item.put("max_score", a.getMaxScore());
                    item.put("percentage", a.getPercentage());
                    item.put("passed", a.getPassed());
                    item.put("submitted_at", a.getSubmittedAt());
                    recentAttempts.add(item);
                }
            }
        }

        BigDecimal avgScore = total > 0
                ? sumScore.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal passPct = total > 0
                ? BigDecimal.valueOf(passedCount * 100.0 / total).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("total_attempts", total);
        out.put("passed_attempts", passedCount);
        out.put("failed_attempts", failedCount);
        out.put("average_score", avgScore);
        out.put("pass_percentage", passPct);
        out.put("total_students", userRepository.countByRole("STUDENT"));
        out.put("active_tests", mockTestRepository.findByStatusOrderByCreatedAtDesc("published").size());
        out.put("recent_attempts", recentAttempts);

        return out;
    }

    public String exportReportsCsv() {
        List<MockTestAttempt> attempts = mockTestAttemptRepository.findAll();
        List<String> headers = Arrays.asList("Attempt ID", "Test ID", "Student ID", "Total Score", "Max Score", "Percentage", "Passed", "Submitted At");
        List<Map<String, Object>> rows = new ArrayList<>();

        for (MockTestAttempt a : attempts) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("Attempt ID", a.getId());
            r.put("Test ID", a.getTestId());
            r.put("Student ID", a.getStudentId());
            r.put("Total Score", a.getTotalScore());
            r.put("Max Score", a.getMaxScore());
            r.put("Percentage", a.getPercentage() != null ? a.getPercentage() + "%" : "");
            r.put("Passed", Boolean.TRUE.equals(a.getPassed()) ? "YES" : "NO");
            r.put("Submitted At", a.getSubmittedAt() != null ? a.getSubmittedAt().toString() : "");
            rows.add(r);
        }

        return csvParserService.generateCsv(headers, rows);
    }
}
