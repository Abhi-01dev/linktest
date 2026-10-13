package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.security.UserPrincipal;
import com.linktest.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        Map<String, Object> status = aiService.getStatus();
        return ResponseEntity.ok(ApiResponse.of(status, "AI Tutor service status."));
    }

    @PostMapping("/init")
    public ResponseEntity<ApiResponse<Map<String, Object>>> initOllama(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> status = aiService.getStatus();
        return ResponseEntity.ok(ApiResponse.of(status, "AI Tutor initialized."));
    }

    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String message = body.getOrDefault("message", "");
        String conversationId = body.getOrDefault("conversation_id", "");
        String userId = userPrincipal != null ? userPrincipal.getUser().getId() : "anon";

        Map<String, Object> result = aiService.chat(userId, message, conversationId);
        return ResponseEntity.ok(ApiResponse.of(result, "AI Tutor response generated."));
    }

    @PostMapping("/generate-quiz")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateQuiz(
            @RequestBody Map<String, Object> body) {

        String topic = (String) body.getOrDefault("topic", "General");
        String subject = (String) body.getOrDefault("subject", "Computer Science");
        String diff = (String) body.getOrDefault("difficulty", "medium");
        int count = 5;
        if (body.get("count") instanceof Number) {
            count = ((Number) body.get("count")).intValue();
        }

        List<Map<String, Object>> questions = aiService.generateQuestions(subject, topic, diff, count);
        return ResponseEntity.ok(ApiResponse.of(Map.of("questions", questions, "available", true), "Practice quiz generated."));
    }
}
