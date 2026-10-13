package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", Instant.now().toString());
        health.put("platform", "LinkTest Spring Boot Backend");
        health.put("javaVersion", System.getProperty("java.version"));

        return ResponseEntity.ok(ApiResponse.success("LinkTest backend service is running", health));
    }
}
