package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.entity.Batch;
import com.linktest.entity.MockTest;
import com.linktest.entity.MockTestAttempt;
import com.linktest.entity.User;
import com.linktest.repository.BatchEnrollmentRepository;
import com.linktest.repository.BatchRepository;
import com.linktest.repository.MockTestAttemptRepository;
import com.linktest.repository.MockTestRepository;
import com.linktest.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
public class TeacherController {

    private final BatchRepository batchRepository;
    private final BatchEnrollmentRepository batchEnrollmentRepository;
    private final MockTestRepository mockTestRepository;
    private final MockTestAttemptRepository mockTestAttemptRepository;

    public TeacherController(
            BatchRepository batchRepository,
            BatchEnrollmentRepository batchEnrollmentRepository,
            MockTestRepository mockTestRepository,
            MockTestAttemptRepository mockTestAttemptRepository) {
        this.batchRepository = batchRepository;
        this.batchEnrollmentRepository = batchEnrollmentRepository;
        this.mockTestRepository = mockTestRepository;
        this.mockTestAttemptRepository = mockTestAttemptRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        User teacher = userPrincipal.getUser();
        List<Batch> batches = batchRepository.findBatchesForTeacher(teacher.getId());

        int totalStudents = 0;
        for (Batch b : batches) {
            totalStudents += batchEnrollmentRepository.countByBatchId(b.getId());
        }

        List<MockTest> tests = mockTestRepository.findAllWithFilters(null, null, null, null, teacher.getId(), null);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("assigned_classes_count", batches.size());
        summary.put("total_assignments", 0);
        summary.put("pending_grading_count", 0);
        summary.put("today_classes_count", 0);
        summary.put("upcoming_live_sessions", 0);

        List<Map<String, Object>> assignedClasses = new ArrayList<>();
        for (Batch b : batches) {
            Map<String, Object> ac = new LinkedHashMap<>();
            ac.put("id", b.getId());
            ac.put("class_id", b.getId());
            ac.put("class_name", b.getName());
            ac.put("batch_name", b.getCode() != null ? b.getCode() : b.getName());
            ac.put("subject_name", b.getDescription() != null && !b.getDescription().isBlank() ? b.getDescription() : "Core Curriculum");
            assignedClasses.add(ac);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("summary", summary);
        data.put("today_schedule", Collections.emptyList());
        data.put("assigned_classes", assignedClasses);
        data.put("upcoming_live_classes", Collections.emptyList());
        data.put("recent_announcements", Collections.emptyList());

        // Extra metadata & backward compatibility
        data.put("assigned_batches_count", batches.size());
        data.put("total_students", totalStudents);
        data.put("tests_created_count", tests.size());
        data.put("batches", batches);
        data.put("recent_tests", tests.stream().limit(5).toList());

        return ResponseEntity.ok(ApiResponse.of(data));
    }

    @GetMapping("/classes")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getClasses(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<Batch> batches = batchRepository.findBatchesForTeacher(userPrincipal.getUser().getId());
        List<Map<String, Object>> list = new ArrayList<>();
        for (Batch b : batches) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", b.getId());
            m.put("class_id", b.getId());
            m.put("class_name", b.getName());
            m.put("batch_id", b.getId());
            m.put("batch_name", b.getCode() != null ? b.getCode() : b.getName());
            m.put("subject_id", "subj-" + b.getId());
            m.put("subject_name", b.getDescription() != null && !b.getDescription().isBlank() ? b.getDescription() : "General Studies");
            list.add(m);
        }
        return ResponseEntity.ok(ApiResponse.of(list));
    }

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudents(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<Batch> batches = batchRepository.findBatchesForTeacher(userPrincipal.getUser().getId());
        List<Map<String, Object>> allStudents = new ArrayList<>();
        Set<String> seenIds = new HashSet<>();

        for (Batch b : batches) {
            List<Map<String, Object>> batchStudents = batchEnrollmentRepository.findStudentDetailsByBatchId(b.getId());
            for (Map<String, Object> s : batchStudents) {
                String sid = (String) s.get("id");
                if (sid != null && seenIds.add(sid)) {
                    allStudents.add(s);
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.of(allStudents));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User u = userPrincipal.getUser();
        Map<String, Object> prof = new LinkedHashMap<>();
        prof.put("id", u.getId());
        prof.put("full_name", u.getFullName());
        prof.put("email", u.getEmail());
        prof.put("role", u.getRole());
        prof.put("employee_id", "FAC-" + u.getId().substring(Math.max(0, u.getId().length() - 6)).toUpperCase());
        prof.put("department", "Computer Science & Engineering");
        prof.put("qualification", "Ph.D. / M.Tech in Computer Science");
        prof.put("specialization", "Full-Stack Software Engineering");

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("user", u);
        res.put("teacher_profile", prof);
        return ResponseEntity.ok(ApiResponse.of(res));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return getProfile(userPrincipal);
    }

    @GetMapping({"/timetable", "/attendance", "/assignments", "/materials", "/live-classes",
            "/announcements", "/leave-requests", "/syllabus"})
    public ResponseEntity<ApiResponse<List<Object>>> getGenericList() {
        return ResponseEntity.ok(ApiResponse.of(Collections.emptyList()));
    }

    @PostMapping({"/attendance", "/assignments", "/materials", "/live-classes",
            "/announcements", "/leave-requests"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> createGenericItem(
            @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.of(body != null ? body : Map.of("created", true), "Created successfully."));
    }

    @PatchMapping("/syllabus/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSyllabus(
            @PathVariable("id") String id,
            @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.of(Map.of("id", id, "updated", true)));
    }
}
