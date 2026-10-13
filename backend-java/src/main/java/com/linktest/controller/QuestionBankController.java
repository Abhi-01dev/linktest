package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.dto.QuestionBankDto.*;
import com.linktest.entity.QuestionBankItem;
import com.linktest.entity.User;
import com.linktest.security.UserPrincipal;
import com.linktest.service.QuestionBankService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
public class QuestionBankController {

    private final QuestionBankService questionBankService;

    public QuestionBankController(QuestionBankService questionBankService) {
        this.questionBankService = questionBankService;
    }

    @GetMapping("/csv/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        String csvString = questionBankService.getSampleTemplate();
        byte[] bytes = csvString.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"linktest_question_template.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                .body(bytes);
    }

    @PostMapping(value = "/csv/preview", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<ApiResponse<PreviewResponse>> previewCsv(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestBody(required = false) ImportCsvRequest jsonBody,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String csvContent = extractCsvContent(file, jsonBody);
        if (csvContent == null || csvContent.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("NO_CSV_PROVIDED", "No CSV file or csvContent data was received in the request."));
        }

        try {
            User user = userPrincipal != null ? userPrincipal.getUser() : new User();
            PreviewResponse preview = questionBankService.previewCsv(csvContent, user);
            return ResponseEntity.ok(ApiResponse.of(preview, "CSV preview generated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("CSV_VALIDATION_ERROR", e.getMessage()));
        }
    }

    @PostMapping(value = "/csv/import", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<ApiResponse<ImportSummaryResponse>> importCsv(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "duplicateStrategy", required = false, defaultValue = "skip") String paramStrategy,
            @RequestBody(required = false) ImportCsvRequest jsonBody,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletRequest request) {

        String csvContent = extractCsvContent(file, jsonBody);
        if (csvContent == null || csvContent.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("NO_CSV_PROVIDED", "No CSV file or csvContent data was received in the request."));
        }

        String duplicateStrategy = paramStrategy;
        if (jsonBody != null && jsonBody.getDuplicateStrategy() != null) {
            duplicateStrategy = jsonBody.getDuplicateStrategy();
        }

        try {
            User user = userPrincipal.getUser();
            String clientIp = request.getRemoteAddr();
            ImportSummaryResponse summary = questionBankService.importCsv(csvContent, user, duplicateStrategy, clientIp);

            String message = String.format("Bulk import completed. %d questions added to Question Bank.", summary.getImportedCount());
            return ResponseEntity.ok(ApiResponse.of(summary, message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("IMPORT_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/csv/error-report")
    public ResponseEntity<byte[]> downloadErrorReport(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> failedRows = (List<Map<String, Object>>) body.getOrDefault("failedRows", List.of());
        String csvString = questionBankService.generateErrorReport(failedRows);
        byte[] bytes = csvString.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"linktest_import_errors.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                .body(bytes);
    }

    @GetMapping("/bank")
    public ResponseEntity<Map<String, Object>> getQuestions(
            @RequestParam(value = "search", required = false, defaultValue = "") String search,
            @RequestParam(value = "subject", required = false, defaultValue = "") String subject,
            @RequestParam(value = "topic", required = false, defaultValue = "") String topic,
            @RequestParam(value = "difficulty", required = false, defaultValue = "") String difficulty,
            @RequestParam(value = "createdBy", required = false, defaultValue = "") String createdBy,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "limit", required = false, defaultValue = "50") int limit,
            @RequestParam(value = "offset", required = false) Integer offset) {

        int pageNum = page;
        if (offset != null && limit > 0) {
            pageNum = offset / limit;
        }

        Page<QuestionBankItem> questionPage = questionBankService.getQuestions(
                search, subject, topic, difficulty, createdBy, pageNum, limit);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", questionPage.getContent());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("total", questionPage.getTotalElements());
        pagination.put("limit", limit);
        pagination.put("offset", (long) pageNum * limit);
        pagination.put("page", pageNum);
        pagination.put("totalPages", questionPage.getTotalPages());
        response.put("pagination", pagination);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/bank/filters")
    public ResponseEntity<ApiResponse<FilterOptionsResponse>> getFilterOptions() {
        FilterOptionsResponse filters = questionBankService.getFilterOptions();
        return ResponseEntity.ok(ApiResponse.of(filters));
    }

    @PostMapping("/bank")
    public ResponseEntity<ApiResponse<QuestionBankItem>> createQuestion(
            @RequestBody CreateQuestionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        if (request.getQuestion_text() == null || request.getQuestion_text().isBlank() ||
            request.getSubject() == null || request.getSubject().isBlank() ||
            request.getTopic() == null || request.getTopic().isBlank()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("INVALID_DATA", "question_text, subject, and topic are required."));
        }

        QuestionBankItem created = questionBankService.createQuestion(request, userPrincipal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(created, "Question added to Question Bank."));
    }

    @DeleteMapping("/bank/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        QuestionBankItem item = questionBankService.findById(id);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", "Question not found in Question Bank."));
        }

        User user = userPrincipal.getUser();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());
        boolean isOwner = item.getCreatedBy() != null && item.getCreatedBy().equals(user.getId());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FORBIDDEN", "You can only delete questions created by your account."));
        }

        questionBankService.deleteQuestion(id, user);
        return ResponseEntity.ok(ApiResponse.of(null, "Question deleted successfully from Question Bank."));
    }

    private String extractCsvContent(MultipartFile file, ImportCsvRequest jsonBody) {
        if (file != null && !file.isEmpty()) {
            try {
                return new String(file.getBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                return null;
            }
        }
        if (jsonBody != null && jsonBody.getCsvContent() != null) {
            return jsonBody.getCsvContent();
        }
        return null;
    }
}
