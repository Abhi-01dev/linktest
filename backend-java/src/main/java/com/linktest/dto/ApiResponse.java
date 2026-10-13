package com.linktest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Collections;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private ApiError.ErrorDetail error;

    public ApiResponse() {
    }

    public ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Operation successful", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(true, "Operation successful", data);
    }

    public static <T> ApiResponse<T> of(T data, String message) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> successMessage(String message) {
        return new ApiResponse<>(true, message, null);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        ApiResponse<T> resp = new ApiResponse<>();
        resp.setSuccess(false);
        resp.setError(new ApiError.ErrorDetail(code, message, Collections.emptyList()));
        return resp;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public ApiError.ErrorDetail getError() {
        return error;
    }

    public void setError(ApiError.ErrorDetail error) {
        this.error = error;
    }
}
