package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.entity.Batch;
import com.linktest.entity.MockTest;
import com.linktest.entity.MockTestAttempt;
import com.linktest.entity.User;
import com.linktest.repository.BatchRepository;
import com.linktest.repository.MockTestAttemptRepository;
import com.linktest.repository.MockTestRepository;
import com.linktest.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@RestController
@RequestMapping({"/api/student", "/api/students"})
@PreAuthorize("isAuthenticated()")
public class StudentController {

    private final BatchRepository batchRepository;
    private final MockTestRepository mockTestRepository;
    private final MockTestAttemptRepository mockTestAttemptRepository;

    public StudentController(
            BatchRepository batchRepository,
            MockTestRepository mockTestRepository,
            MockTestAttemptRepository mockTestAttemptRepository) {
        this.batchRepository = batchRepository;
        this.mockTestRepository = mockTestRepository;
        this.mockTestAttemptRepository = mockTestAttemptRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        User student = userPrincipal.getUser();
        List<Batch> enrolledBatches = batchRepository.findBatchesForStudent(student.getId());
        List<MockTest> availableTests = mockTestRepository.findByStatusOrderByCreatedAtDesc("published");
        List<MockTestAttempt> myAttempts = mockTestAttemptRepository.findByStudentIdOrderByStartedAtDesc(student.getId());

        int passed = 0;
        BigDecimal sumPct = BigDecimal.ZERO;
        for (MockTestAttempt a : myAttempts) {
            if (Boolean.TRUE.equals(a.getPassed())) passed++;
            if (a.getPercentage() != null) sumPct = sumPct.add(a.getPercentage());
        }

        BigDecimal avgPct = !myAttempts.isEmpty()
                ? sumPct.divide(BigDecimal.valueOf(myAttempts.size()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("enrolled_batches_count", enrolledBatches.size());
        data.put("available_tests_count", availableTests.size());
        data.put("completed_attempts_count", myAttempts.size());
        data.put("passed_attempts_count", passed);
        data.put("average_percentage", avgPct);
        data.put("enrolled_batches", enrolledBatches);
        data.put("recent_attempts", myAttempts.stream().limit(5).toList());

        return ResponseEntity.ok(ApiResponse.of(data));
    }

    @GetMapping("/classes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getClasses(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<Batch> batches = batchRepository.findBatchesForStudent(userPrincipal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.of(Map.of("classes", batches, "batches", batches)));
    }

    @GetMapping({"/timetable", "/attendance", "/assignments", "/materials", "/live-classes",
            "/announcements", "/notifications", "/tickets"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGenericList() {
        return ResponseEntity.ok(ApiResponse.of(Map.of("items", Collections.emptyList())));
    }

    @PostMapping("/notifications/read")
    public ResponseEntity<ApiResponse<Void>> markNotificationsRead() {
        return ResponseEntity.ok(ApiResponse.of(null, "Notifications marked as read."));
    }
}
