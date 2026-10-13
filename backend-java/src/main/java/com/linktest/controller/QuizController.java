package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.entity.Quiz;
import com.linktest.entity.QuizAttempt;
import com.linktest.security.UserPrincipal;
import com.linktest.service.LmsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final LmsService lmsService;

    public QuizController(LmsService lmsService) {
        this.lmsService = lmsService;
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getQuizzesByCourse(@PathVariable("courseId") String courseId) {
        List<Quiz> quizzes = lmsService.getQuizzesByCourse(courseId);
        return ResponseEntity.ok(ApiResponse.of(Map.of("quizzes", quizzes)));
    }

    @GetMapping("/attempts/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyAttempts(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<QuizAttempt> attempts = lmsService.getMyAttempts(userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(Map.of("attempts", attempts)));
    }

    @GetMapping("/attempts/{attemptId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<QuizAttempt>> getAttemptDetails(
            @PathVariable("attemptId") String attemptId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        QuizAttempt attempt = lmsService.getAttemptDetails(attemptId, userPrincipal.getUser());
        if (attempt == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", "Attempt not found."));
        }
        return ResponseEntity.ok(ApiResponse.of(attempt));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getQuizById(@PathVariable("id") String id) {
        Map<String, Object> quizDetails = lmsService.getQuizById(id);
        if (quizDetails == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", "Quiz not found."));
        }
        return ResponseEntity.ok(ApiResponse.of(quizDetails));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Quiz>> createQuiz(@RequestBody Quiz quiz) {
        Quiz created = lmsService.createQuiz(quiz);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(created, "Quiz created."));
    }

    @PostMapping("/{id}/attempts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitAttempt(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> submission,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            Map<String, Object> result = lmsService.submitQuizAttempt(id, submission, userPrincipal.getUser());
            return ResponseEntity.ok(ApiResponse.of(result, "Quiz evaluated successfully."));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("SUBMIT_FAILED", ex.getMessage()));
        }
    }
}
