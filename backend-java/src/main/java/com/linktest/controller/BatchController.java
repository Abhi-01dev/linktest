package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.dto.BatchDto.*;
import com.linktest.entity.Batch;
import com.linktest.entity.BatchTeacher;
import com.linktest.security.UserPrincipal;
import com.linktest.service.BatchService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/batches")
@PreAuthorize("isAuthenticated()")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBatches(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "course_id", required = false) String courseId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<Batch> batches = batchService.getBatches(search, status, courseId, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(Map.of("batches", batches), "Batches list retrieved."));
    }

    @GetMapping("/students/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchStudents(
            @RequestParam(value = "q", required = false, defaultValue = "") String query,
            @RequestParam(value = "limit", required = false, defaultValue = "20") int limit) {

        List<Map<String, Object>> students = batchService.searchStudents(query, limit);
        return ResponseEntity.ok(ApiResponse.of(Map.of("students", students, "total", students.size()), "Eligible students retrieved."));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createBatch(
            @RequestBody CreateBatchRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        if (req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("VALIDATION_ERROR", "Batch name is required."));
        }

        try {
            Batch batch = batchService.createBatch(req, userPrincipal.getUser());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.of(Map.of("batch", batch), "Batch '" + batch.getName() + "' created successfully."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("CONFLICT", ex.getMessage()));
        }
    }

    @GetMapping("/{batchId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBatchDetail(
            @PathVariable("batchId") String batchId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            Map<String, Object> batchDetail = batchService.getBatchDetail(batchId, userPrincipal.getUser());
            if (batchDetail == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("NOT_FOUND", "Batch not found."));
            }
            return ResponseEntity.ok(ApiResponse.of(Map.of("batch", batchDetail), "Batch details retrieved."));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("FORBIDDEN", ex.getMessage()));
        }
    }

    @RequestMapping(value = "/{batchId}", method = {RequestMethod.PUT, RequestMethod.PATCH})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateBatch(
            @PathVariable("batchId") String batchId,
            @RequestBody CreateBatchRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            Batch updated = batchService.updateBatch(batchId, req, userPrincipal.getUser());
            return ResponseEntity.ok(ApiResponse.of(Map.of("batch", updated), "Batch updated successfully."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("UPDATE_FAILED", ex.getMessage()));
        }
    }

    @PostMapping("/{batchId}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> archiveBatch(
            @PathVariable("batchId") String batchId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            Batch archived = batchService.archiveBatch(batchId, userPrincipal.getUser());
            return ResponseEntity.ok(ApiResponse.of(Map.of("batch", archived), "Batch '" + archived.getName() + "' archived successfully."));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ARCHIVE_FAILED", ex.getMessage()));
        }
    }

    @DeleteMapping("/{batchId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(
            @PathVariable("batchId") String batchId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        batchService.deleteBatch(batchId, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(null, "Batch permanently deleted."));
    }

    @GetMapping("/{batchId}/teachers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBatchTeachers(
            @PathVariable("batchId") String batchId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            List<Map<String, Object>> teachers = batchService.getBatchTeachers(batchId, userPrincipal.getUser());
            return ResponseEntity.ok(ApiResponse.of(Map.of("teachers", teachers), "Assigned teachers retrieved."));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("FORBIDDEN", ex.getMessage()));
        }
    }

    @PostMapping("/{batchId}/teachers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> assignTeacher(
            @PathVariable("batchId") String batchId,
            @RequestBody AssignTeacherRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            BatchTeacher allocation = batchService.assignTeacher(batchId, req.getTeacher_id(), userPrincipal.getUser());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.of(Map.of("allocation", allocation), "Teacher assigned to batch successfully."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ASSIGN_FAILED", ex.getMessage()));
        }
    }

    @DeleteMapping("/{batchId}/teachers/{teacherId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeTeacher(
            @PathVariable("batchId") String batchId,
            @PathVariable("teacherId") String teacherId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        batchService.removeTeacher(batchId, teacherId, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(null, "Teacher removed from batch."));
    }

    @GetMapping("/{batchId}/students")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBatchStudents(
            @PathVariable("batchId") String batchId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            List<Map<String, Object>> students = batchService.getBatchStudents(batchId, userPrincipal.getUser());
            return ResponseEntity.ok(ApiResponse.of(Map.of("students", students), "Enrolled students retrieved."));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("FORBIDDEN", ex.getMessage()));
        }
    }

    @PostMapping("/{batchId}/students")
    public ResponseEntity<ApiResponse<Map<String, Object>>> enrollStudents(
            @PathVariable("batchId") String batchId,
            @RequestBody EnrollStudentsRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<String> studentIds = req.getStudent_ids() != null ? req.getStudent_ids() :
                (req.getStudent_id() != null ? List.of(req.getStudent_id()) : Collections.emptyList());

        if (studentIds.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("VALIDATION_ERROR", "At least one student ID is required."));
        }

        try {
            Map<String, Object> result = batchService.enrollStudents(batchId, studentIds, userPrincipal.getUser());
            String msg = "Successfully enrolled " + result.get("total_enrolled") + " student(s) into batch.";
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(result, msg));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("FORBIDDEN", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ENROLL_FAILED", ex.getMessage()));
        }
    }

    @DeleteMapping("/{batchId}/students/{studentId}")
    public ResponseEntity<ApiResponse<Void>> removeStudent(
            @PathVariable("batchId") String batchId,
            @PathVariable("studentId") String studentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            batchService.removeStudent(batchId, studentId, userPrincipal.getUser());
            return ResponseEntity.ok(ApiResponse.of(null, "Student removed from batch."));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("FORBIDDEN", ex.getMessage()));
        }
    }
}
