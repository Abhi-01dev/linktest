package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.service.LiveKitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/livekit")
public class LiveKitController {

    private final LiveKitService liveKitService;

    @Autowired
    public LiveKitController(LiveKitService liveKitService) {
        this.liveKitService = liveKitService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(liveKitService.getStatus()));
    }

    @PostMapping("/token")
    public ResponseEntity<?> generateToken(@RequestBody Map<String, String> request) {
        String roomName = request.get("roomName");
        if (roomName == null || roomName.isBlank()) {
            Map<String, Object> errResponse = new HashMap<>();
            errResponse.put("success", false);
            Map<String, String> errDetail = new HashMap<>();
            errDetail.put("code", "MISSING_ROOM");
            errDetail.put("message", "roomName is required.");
            errResponse.put("error", errDetail);
            return ResponseEntity.badRequest().body(errResponse);
        }

        String participantIdentity = request.getOrDefault("participantIdentity", "guest-user");
        String participantName = request.getOrDefault("participantName", "Guest Participant");
        boolean isPublisher = Boolean.parseBoolean(request.getOrDefault("isPublisher", "false"));

        Map<String, Object> result = liveKitService.generateToken(roomName, participantIdentity, participantName, isPublisher);
        boolean success = Boolean.TRUE.equals(result.get("success"));

        if (!success) {
            Map<String, Object> failureResponse = new HashMap<>();
            failureResponse.put("success", false);
            Map<String, Object> errDetail = new HashMap<>();
            errDetail.put("code", result.get("error"));
            errDetail.put("message", result.get("message"));
            failureResponse.put("error", errDetail);
            failureResponse.put("data", Collections.singletonMap("fallback", "external"));
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(failureResponse);
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
