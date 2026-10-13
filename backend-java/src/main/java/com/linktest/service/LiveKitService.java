package com.linktest.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class LiveKitService {

    private static final Logger log = LoggerFactory.getLogger(LiveKitService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${livekit.url:${app.livekit.url:}}")
    private String serverUrl;

    @Value("${livekit.api-key:${app.livekit.api-key:}}")
    private String apiKey;

    @Value("${livekit.api-secret:${app.livekit.api-secret:}}")
    private String apiSecret;

    public boolean isConfigured() {
        return serverUrl != null && !serverUrl.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();
    }

    public Map<String, Object> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        boolean configured = isConfigured();
        status.put("configured", configured);
        status.put("serverUrl", configured ? serverUrl : null);
        status.put("provider", configured ? "livekit" : "external_fallback");
        status.put("message", configured
                ? "LiveKit WebRTC service is configured and ready."
                : "LiveKit server credentials are unconfigured. External meeting links (Zoom/Meet/Teams) are used as fallback.");
        return status;
    }

    public Map<String, Object> generateToken(String roomName, String participantIdentity, String participantName, boolean isPublisher) {
        Map<String, Object> response = new LinkedHashMap<>();

        if (!isConfigured()) {
            response.put("success", false);
            response.put("configured", false);
            response.put("error", "LIVEKIT_NOT_CONFIGURED");
            response.put("message", "LiveKit credentials are not configured on this server. Please use external meeting fallback.");
            return response;
        }

        try {
            long now = Instant.now().getEpochSecond();
            long ttl = 6 * 3600; // 6 hours

            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> videoGrant = new LinkedHashMap<>();
            videoGrant.put("room", roomName);
            videoGrant.put("roomJoin", true);
            videoGrant.put("canPublish", isPublisher);
            videoGrant.put("canSubscribe", true);
            videoGrant.put("canPublishData", true);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("iss", apiKey);
            payload.put("sub", participantIdentity);
            payload.put("name", participantName);
            payload.put("iat", now);
            payload.put("nbf", now);
            payload.put("exp", now + ttl);
            payload.put("video", videoGrant);

            String encodedHeader = base64UrlEncode(objectMapper.writeValueAsString(header).getBytes(StandardCharsets.UTF_8));
            String encodedPayload = base64UrlEncode(objectMapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8));
            String signatureInput = encodedHeader + "." + encodedPayload;

            Mac hmacSha256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmacSha256.init(secretKey);
            byte[] signatureBytes = hmacSha256.doFinal(signatureInput.getBytes(StandardCharsets.UTF_8));
            String encodedSignature = base64UrlEncode(signatureBytes);

            String jwtToken = signatureInput + "." + encodedSignature;

            response.put("success", true);
            response.put("configured", true);
            response.put("token", jwtToken);
            response.put("serverUrl", serverUrl);
            response.put("roomName", roomName);
            response.put("participantIdentity", participantIdentity);
            return response;
        } catch (Exception ex) {
            log.error("LiveKit token generation failed: {}", ex.getMessage());
            response.put("success", false);
            response.put("configured", true);
            response.put("error", "TOKEN_GENERATION_FAILED");
            response.put("message", ex.getMessage());
            return response;
        }
    }

    private String base64UrlEncode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }
}
