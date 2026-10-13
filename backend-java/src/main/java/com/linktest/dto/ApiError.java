package com.linktest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class ApiError {

    private boolean success = false;

    @JsonProperty("request_id")
    private String requestId;

    private ErrorDetail error;

    public ApiError() {
        this.requestId = UUID.randomUUID().toString();
    }

    public ApiError(String code, String message) {
        this.requestId = UUID.randomUUID().toString();
        this.error = new ErrorDetail(code, message, Collections.emptyList());
    }

    public ApiError(String code, String message, List<?> details) {
        this.requestId = UUID.randomUUID().toString();
        this.error = new ErrorDetail(code, message, details != null ? details : Collections.emptyList());
    }

    public static ApiError of(String code, String message) {
        return new ApiError(code, message);
    }

    public static ApiError of(String code, String message, List<?> details) {
        return new ApiError(code, message, details);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public ErrorDetail getError() {
        return error;
    }

    public void setError(ErrorDetail error) {
        this.error = error;
    }

    public static class ErrorDetail {
        private String code;
        private String message;
        private List<?> details;

        public ErrorDetail() {
        }

        public ErrorDetail(String code, String message, List<?> details) {
            this.code = code;
            this.message = message;
            this.details = details;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public List<?> getDetails() {
            return details;
        }

        public void setDetails(List<?> details) {
            this.details = details;
        }
    }
}
