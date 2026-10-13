package com.linktest.exception;

import com.linktest.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("BAD_REQUEST", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException ex) {
        String msg = ex.getMessage();
        if (msg != null && msg.contains("already exists")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("CONFLICT", msg));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("INVALID_STATE", msg));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Void>> handleSecurityException(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("UNAUTHORIZED", ex.getMessage()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthException(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("UNAUTHORIZED", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("FORBIDDEN", "Forbidden: You do not have permission to perform this action."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        log.error("Unhandled exception: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", ex.getMessage()));
    }
}
