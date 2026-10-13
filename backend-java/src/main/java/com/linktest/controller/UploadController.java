package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.security.UserPrincipal;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    public UploadController() {
        try {
            Files.createDirectories(uploadDir.resolve("materials"));
            Files.createDirectories(uploadDir.resolve("submissions"));
            Files.createDirectories(uploadDir.resolve("avatars"));
        } catch (IOException e) {
            // Log directory creation warning
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false, defaultValue = "materials") String category,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("NO_FILE", "No file was uploaded in request."));
        }

        String safeCat = switch (category.toLowerCase()) {
            case "submissions" -> "submissions";
            case "avatars" -> "avatars";
            default -> "materials";
        };

        try {
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String ext = "";
            int dotIdx = originalName.lastIndexOf('.');
            if (dotIdx > 0) {
                ext = originalName.substring(dotIdx);
            }

            String storedName = UUID.randomUUID().toString() + ext;
            Path targetDir = uploadDir.resolve(safeCat);
            Files.createDirectories(targetDir);
            Path targetPath = targetDir.resolve(storedName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/upload/files/" + safeCat + "/" + storedName;

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("file_url", fileUrl);
            data.put("original_name", originalName);
            data.put("file_name", storedName);
            data.put("file_size", file.getSize());
            data.put("category", safeCat);
            data.put("mime_type", file.getContentType());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.of(data, "File successfully uploaded and stored."));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("UPLOAD_ERROR", e.getMessage()));
        }
    }

    @GetMapping("/files/{category}/{filename}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable("category") String category,
            @PathVariable("filename") String filename) {

        try {
            Path filePath = uploadDir.resolve(category).resolve(filename).normalize();
            if (!filePath.startsWith(uploadDir)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
