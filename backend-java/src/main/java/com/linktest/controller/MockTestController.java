package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.dto.MockTestDto.*;
import com.linktest.entity.*;
import com.linktest.repository.MockTestAttemptRepository;
import com.linktest.repository.MockTestProctoringEventRepository;
import com.linktest.repository.MockTestRepository;
import com.linktest.security.UserPrincipal;
import com.linktest.service.MockTestService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mock-tests")
public class MockTestController {

    private final MockTestService mockTestService;
    private final MockTestRepository mockTestRepository;
    private final MockTestAttemptRepository mockTestAttemptRepository;
    private final MockTestProctoringEventRepository mockTestProctoringEventRepository;
    private final com.linktest.service.AiService aiService;

    public MockTestController(
            MockTestService mockTestService,
            MockTestRepository mockTestRepository,
            MockTestAttemptRepository mockTestAttemptRepository,
            MockTestProctoringEventRepository mockTestProctoringEventRepository,
            com.linktest.service.AiService aiService) {
        this.mockTestService = mockTestService;
        this.mockTestRepository = mockTestRepository;
        this.mockTestAttemptRepository = mockTestAttemptRepository;
        this.mockTestProctoringEventRepository = mockTestProctoringEventRepository;
        this.aiService = aiService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllTests(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "difficulty", required = false) String difficulty,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "search", required = false) String search,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        User user = userPrincipal != null ? userPrincipal.getUser() : null;
        String createdBy = null;
        if (user != null && "TEACHER".equalsIgnoreCase(user.getRole()) && "mine".equalsIgnoreCase(scope)) {
            createdBy = user.getId();
        }

        List<MockTest> tests = mockTestService.getAllTests(status, subject, difficulty, category, createdBy, search, user);
        return ResponseEntity.ok(ApiResponse.of(Map.of("tests", tests)));
    }

    @GetMapping("/my-attempts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyAttempts(
            @RequestParam(value = "test_id", required = false) String testId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        User user = userPrincipal.getUser();
        List<MockTestAttempt> attempts;
        if (testId != null && !testId.isBlank()) {
            attempts = mockTestAttemptRepository.findByStudentIdAndTestIdOrderByStartedAtDesc(user.getId(), testId);
        } else {
            attempts = mockTestAttemptRepository.findByStudentIdOrderByStartedAtDesc(user.getId());
        }

        return ResponseEntity.ok(ApiResponse.of(Map.of("attempts", attempts)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTestById(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        User user = userPrincipal != null ? userPrincipal.getUser() : null;
        Map<String, Object> details = mockTestService.getTestDetails(id, user);

        if (details == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", "Mock test not found."));
        }

        return ResponseEntity.ok(ApiResponse.of(details));
    }

    @PostMapping("/{id}/attempts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startAttempt(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletRequest request) {

        try {
            String clientIp = request.getRemoteAddr();
            Map<String, Object> attemptData = mockTestService.startOrResumeAttempt(id, userPrincipal.getUser(), clientIp);
            return ResponseEntity.ok(ApiResponse.of(attemptData, "Exam session initialized successfully."));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ATTEMPT_ERROR", ex.getMessage()));
        }
    }

    @GetMapping("/attempts/{attemptId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAttempt(
            @PathVariable("attemptId") String attemptId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            Map<String, Object> data = mockTestService.getAttemptForTaker(attemptId, userPrincipal.getUser());
            return ResponseEntity.ok(ApiResponse.of(data));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ATTEMPT_ERROR", ex.getMessage()));
        }
    }

    @PutMapping("/attempts/{attemptId}/answers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveAnswer(
            @PathVariable("attemptId") String attemptId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            // Check if bulk answers map provided: { answers: { "q1": { response_data: ... } } }
            if (body.containsKey("answers") && body.get("answers") instanceof Map<?, ?>) {
                @SuppressWarnings("unchecked")
                Map<String, Object> answersMap = (Map<String, Object>) body.get("answers");
                for (Map.Entry<String, Object> entry : answersMap.entrySet()) {
                    SaveAnswerRequest req = new SaveAnswerRequest();
                    req.setQuestion_id(entry.getKey());
                    if (entry.getValue() instanceof Map<?, ?>) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> valMap = (Map<String, Object>) entry.getValue();
                        req.setResponse_data(valMap.containsKey("response_data") ? (Map<String, Object>) valMap.get("response_data") : valMap);
                        req.setIs_marked_for_review(Boolean.TRUE.equals(valMap.get("is_marked_for_review")));
                    }
                    mockTestService.saveResponse(attemptId, userPrincipal.getUser(), req);
                }
                return ResponseEntity.ok(ApiResponse.of(Map.of("saved_count", answersMap.size())));
            }

            // Check if bulk responses list provided: { responses: [ { question_id: "...", ... } ] }
            if (body.containsKey("responses") && body.get("responses") instanceof List<?> list) {
                for (Object item : list) {
                    if (item instanceof Map<?, ?>) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> itemMap = (Map<String, Object>) item;
                        SaveAnswerRequest req = new SaveAnswerRequest();
                        String qId = (String) (itemMap.get("question_id") != null ? itemMap.get("question_id") : itemMap.get("questionId"));
                        req.setQuestion_id(qId);
                        if (itemMap.get("response_data") instanceof Map<?, ?>) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> rd = (Map<String, Object>) itemMap.get("response_data");
                            req.setResponse_data(rd);
                        } else {
                            Map<String, Object> rd = new HashMap<>(itemMap);
                            rd.remove("question_id");
                            rd.remove("questionId");
                            rd.remove("is_marked_for_review");
                            rd.remove("isMarkedForReview");
                            req.setResponse_data(rd);
                        }
                        req.setIs_marked_for_review(Boolean.TRUE.equals(itemMap.get("is_marked_for_review")));
                        mockTestService.saveResponse(attemptId, userPrincipal.getUser(), req);
                    }
                }
                return ResponseEntity.ok(ApiResponse.of(Map.of("saved_count", list.size())));
            }

            // Single answer
            SaveAnswerRequest req = new SaveAnswerRequest();
            String qId = (String) (body.get("question_id") != null ? body.get("question_id") : body.get("questionId"));
            req.setQuestion_id(qId);
            if (body.get("response_data") instanceof Map<?, ?>) {
                @SuppressWarnings("unchecked")
                Map<String, Object> rd = (Map<String, Object>) body.get("response_data");
                req.setResponse_data(rd);
            } else if (body.get("responseData") instanceof Map<?, ?>) {
                @SuppressWarnings("unchecked")
                Map<String, Object> rd = (Map<String, Object>) body.get("responseData");
                req.setResponse_data(rd);
            } else {
                Map<String, Object> rd = new HashMap<>(body);
                rd.remove("question_id");
                rd.remove("questionId");
                rd.remove("is_marked_for_review");
                rd.remove("isMarkedForReview");
                req.setResponse_data(rd);
            }
            req.setIs_marked_for_review(Boolean.TRUE.equals(body.get("is_marked_for_review")) || Boolean.TRUE.equals(body.get("isMarkedForReview")));
            MockTestResponse saved = mockTestService.saveResponse(attemptId, userPrincipal.getUser(), req);

            return ResponseEntity.ok(ApiResponse.of(Map.of("response", saved)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("SAVE_FAILED", ex.getMessage()));
        }
    }

    @PostMapping("/attempts/{attemptId}/events")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MockTestProctoringEvent>> logProctoringEvent(
            @PathVariable("attemptId") String attemptId,
            @RequestBody LogEventRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            MockTestProctoringEvent event = mockTestService.ingestProctoringEvent(attemptId, userPrincipal.getUser(), req);
            return ResponseEntity.ok(ApiResponse.of(event));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("EVENT_LOG_FAILED", ex.getMessage()));
        }
    }

    @PostMapping(value = "/attempts/{attemptId}/submit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitAttempt(
            @PathVariable("attemptId") String attemptId,
            @RequestBody(required = false) Map<String, Object> rawReq,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            SubmitAttemptRequest subReq = new SubmitAttemptRequest();
            if (rawReq != null && rawReq.containsKey("proctoring_score")) {
                Object ps = rawReq.get("proctoring_score");
                if (ps instanceof Number) subReq.setProctoring_score(BigDecimal.valueOf(((Number) ps).doubleValue()));
            }
            Map<String, Object> result = mockTestService.submitAttempt(attemptId, userPrincipal.getUser(), subReq);
            return ResponseEntity.ok(ApiResponse.of(result, "Examination submitted and evaluated successfully."));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("SUBMIT_FAILED", ex.getMessage()));
        }
    }

    @GetMapping("/attempts/{attemptId}/result")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAttemptResult(
            @PathVariable("attemptId") String attemptId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        try {
            Map<String, Object> result = mockTestService.getAttemptResult(attemptId, userPrincipal.getUser());
            return ResponseEntity.ok(ApiResponse.of(result));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("RESULT_NOT_FOUND", ex.getMessage()));
        }
    }

    @GetMapping("/attempts/{attemptId}/proctoring-events")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProctoringEvents(
            @PathVariable("attemptId") String attemptId) {

        List<MockTestProctoringEvent> events = mockTestProctoringEventRepository.findByAttemptIdOrderByServerTimestampAsc(attemptId);
        return ResponseEntity.ok(ApiResponse.of(Map.of("events", events)));
    }

    @GetMapping("/{id}/attempts")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTestAttempts(@PathVariable("id") String id) {
        List<MockTestAttempt> attempts = mockTestAttemptRepository.findByTestIdOrderByStartedAtDesc(id);
        return ResponseEntity.ok(ApiResponse.of(Map.of("attempts", attempts)));
    }

    @GetMapping("/{id}/analytics")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTestAnalytics(@PathVariable("id") String id) {
        Map<String, Object> analytics = mockTestService.getTestAnalytics(id);
        return ResponseEntity.ok(ApiResponse.of(analytics));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMockTest(
            @RequestBody CreateTestRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        if (req.getTitle() == null || req.getTitle().isBlank() || req.getSubject() == null || req.getSubject().isBlank()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("VALIDATION_ERROR", "Test title and subject are required."));
        }

        MockTest created = mockTestService.createMockTest(req, userPrincipal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(Map.of("test", created), "Mock test created successfully."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateMockTest(
            @PathVariable("id") String id,
            @RequestBody CreateTestRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        MockTest updated = mockTestService.updateMockTest(id, req, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(Map.of("test", updated), "Mock test updated successfully."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMockTest(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        mockTestService.deleteMockTest(id, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.of(null, "Mock test deleted successfully."));
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> duplicateMockTest(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        MockTest duplicated = mockTestService.duplicateMockTest(id, userPrincipal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(Map.of("test", duplicated), "Test duplicated successfully as draft."));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publishMockTest(
            @PathVariable("id") String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String status = body.getOrDefault("status", "published");
        CreateTestRequest req = new CreateTestRequest();
        req.setStatus(status);
        MockTest updated = mockTestService.updateMockTest(id, req, userPrincipal.getUser());

        return ResponseEntity.ok(ApiResponse.of(Map.of("test", updated), "Test status updated to '" + status + "'."));
    }

    @PostMapping("/{id}/release-results")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> releaseResults(
            @PathVariable("id") String id,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Boolean resultsPublished = body.getOrDefault("results_published", true);
        CreateTestRequest req = new CreateTestRequest();
        req.setResults_published(resultsPublished);
        MockTest updated = mockTestService.updateMockTest(id, req, userPrincipal.getUser());

        String msg = resultsPublished ? "Examination results released to candidates." : "Results unpublished.";
        return ResponseEntity.ok(ApiResponse.of(Map.of("test", updated), msg));
    }

    @PostMapping("/generate-questions")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateAiQuestions(
            @RequestBody Map<String, Object> body) {

        String subject = (String) body.getOrDefault("subject", "Computer Science");
        String topic = (String) body.getOrDefault("topic", "General");
        String difficulty = (String) body.getOrDefault("difficulty", "medium");
        int count = 5;
        if (body.get("count") instanceof Number) {
            count = ((Number) body.get("count")).intValue();
        }

        List<Map<String, Object>> questions = aiService.generateQuestions(subject, topic, difficulty, count);
        return ResponseEntity.ok(ApiResponse.of(Map.of("questions", questions), "Questions generated successfully."));
    }
}
