package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.entity.Lesson;
import com.linktest.service.LmsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LmsService lmsService;

    public LessonController(LmsService lmsService) {
        this.lmsService = lmsService;
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLessonsByCourse(@PathVariable("courseId") String courseId) {
        List<Lesson> lessons = lmsService.getLessonsByCourse(courseId);
        return ResponseEntity.ok(ApiResponse.of(Map.of("lessons", lessons)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Lesson>> getLessonById(@PathVariable("id") String id) {
        Lesson lesson = lmsService.getLessonById(id);
        if (lesson == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", "Lesson not found."));
        }
        return ResponseEntity.ok(ApiResponse.of(lesson));
    }

    @PostMapping("/course/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Lesson>> createLesson(
            @PathVariable("courseId") String courseId,
            @RequestBody Lesson lesson) {
        Lesson created = lmsService.createLesson(courseId, lesson);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(created, "Lesson created."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Lesson>> updateLesson(
            @PathVariable("id") String id,
            @RequestBody Lesson lesson) {
        Lesson updated = lmsService.updateLesson(id, lesson);
        return ResponseEntity.ok(ApiResponse.of(updated, "Lesson updated."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable("id") String id) {
        lmsService.deleteLesson(id);
        return ResponseEntity.ok(ApiResponse.of(null, "Lesson deleted."));
    }
}
