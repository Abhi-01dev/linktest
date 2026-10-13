package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.entity.Course;
import com.linktest.entity.User;
import com.linktest.security.UserPrincipal;
import com.linktest.service.LmsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final LmsService lmsService;

    public CourseController(LmsService lmsService) {
        this.lmsService = lmsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAll(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User user = userPrincipal != null ? userPrincipal.getUser() : null;
        List<Course> courses = lmsService.getAllCourses(user);
        return ResponseEntity.ok(ApiResponse.of(Map.of("courses", courses)));
    }

    @GetMapping("/enrolled/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyCourses(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Course> courses = lmsService.getAllCourses(userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(Map.of("courses", courses)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable("id") String id) {
        Map<String, Object> details = lmsService.getCourseById(id);
        if (details == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", "Course not found."));
        }
        return ResponseEntity.ok(ApiResponse.of(details));
    }

    @PostMapping("/{id}/enroll")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> enroll(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(ApiResponse.of(Map.of("enrolled", true, "courseId", id), "Enrolled successfully."));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Course>> create(
            @RequestBody Course course,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Course created = lmsService.createCourse(course, userPrincipal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(created, "Course created successfully."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Course>> update(
            @PathVariable("id") String id,
            @RequestBody Course course,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Course updated = lmsService.updateCourse(id, course, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(updated, "Course updated successfully."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        lmsService.deleteCourse(id, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(null, "Course deleted successfully."));
    }
}
