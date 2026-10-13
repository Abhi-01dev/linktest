package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.entity.AuditLog;
import com.linktest.entity.SecurityLog;
import com.linktest.entity.User;
import com.linktest.security.UserPrincipal;
import com.linktest.service.AdminService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.of(stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsers(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {

        Page<User> usersPage = adminService.getUsers(role, status, search, page, limit);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("users", usersPage.getContent());
        data.put("total", usersPage.getTotalElements());
        data.put("page", page);
        data.put("totalPages", usersPage.getTotalPages());

        return ResponseEntity.ok(ApiResponse.of(data));
    }

    @RequestMapping(value = {"/users/{userId}/status", "/students/{userId}/status", "/teachers/{userId}/status"},
            method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<User>> updateUserStatus(
            @PathVariable("userId") String userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String status = body.getOrDefault("status", "active");
        User updated = adminService.updateUserStatus(userId, status, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(updated, "User status updated to '" + status + "'."));
    }

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudents(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {

        Page<User> studentsPage = adminService.getUsers("STUDENT", null, search, page, limit);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("students", studentsPage.getContent());
        data.put("total", studentsPage.getTotalElements());
        return ResponseEntity.ok(ApiResponse.of(data));
    }

    @GetMapping("/teachers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTeachers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {

        Page<User> teachersPage = adminService.getUsers("TEACHER", null, search, page, limit);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("teachers", teachersPage.getContent());
        data.put("total", teachersPage.getTotalElements());
        return ResponseEntity.ok(ApiResponse.of(data));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuditLogs(
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "resource_type", required = false) String resourceType,
            @RequestParam(value = "start_date", required = false) String startDate,
            @RequestParam(value = "end_date", required = false) String endDate,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {

        Instant start = parseInstant(startDate);
        Instant end = parseInstant(endDate);

        Page<AuditLog> logPage = adminService.getAuditLogs(action, resourceType, start, end, search, page, limit);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("logs", logPage.getContent());
        data.put("total", logPage.getTotalElements());
        data.put("page", page);
        data.put("totalPages", logPage.getTotalPages());

        return ResponseEntity.ok(ApiResponse.of(data));
    }

    @GetMapping("/security-logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityLogs(
            @RequestParam(value = "event_type", required = false) String eventType,
            @RequestParam(value = "severity", required = false) String severity,
            @RequestParam(value = "start_date", required = false) String startDate,
            @RequestParam(value = "end_date", required = false) String endDate,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {

        Instant start = parseInstant(startDate);
        Instant end = parseInstant(endDate);

        Page<SecurityLog> logPage = adminService.getSecurityLogs(eventType, severity, start, end, search, page, limit);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("logs", logPage.getContent());
        data.put("total", logPage.getTotalElements());
        data.put("page", page);
        data.put("totalPages", logPage.getTotalPages());

        return ResponseEntity.ok(ApiResponse.of(data));
    }

    @GetMapping({"/reports", "/reports/overview"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReportsOverview() {
        Map<String, Object> reports = adminService.getReportsOverview();
        return ResponseEntity.ok(ApiResponse.of(reports));
    }

    @GetMapping("/reports/export")
    public ResponseEntity<byte[]> exportReportsCsv() {
        String csvString = adminService.exportReportsCsv();
        byte[] bytes = csvString.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"linktest_performance_reports.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                .body(bytes);
    }

    // Safe fallbacks for secondary administration pages so frontend never crashes
    @GetMapping({"/classes", "/subjects", "/timetable", "/attendance", "/assignments", "/announcements",
            "/live-classes", "/leave-requests", "/tickets", "/academic-sessions"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGenericList() {
        return ResponseEntity.ok(ApiResponse.of(Map.of("items", Collections.emptyList())));
    }

    private Instant parseInstant(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            return Instant.parse(str);
        } catch (Exception e) {
            return null;
        }
    }
}
