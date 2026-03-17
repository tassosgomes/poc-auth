package com.zcorp.ordersservice.api.error;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Objects;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.zcorp.ordersservice.security.PermissionDeniedException;
import com.zcorp.ordersservice.security.PermissionMatrixUnavailableException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(PermissionDeniedException.class)
    public ProblemDetail handlePermissionDenied(PermissionDeniedException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = buildProblem(
                HttpStatus.FORBIDDEN,
                "FORBIDDEN",
                exception.getMessage(),
                request,
                URI.create("https://errors.zcorp.internal/iam/forbidden"));
        problemDetail.setProperty("permission", exception.getPermission());
        problemDetail.setProperty("resource", exception.getResource());
        problemDetail.setProperty("matchedRoles", exception.getDecision().matchedRoles());
        problemDetail.setProperty("matchedPermissions", exception.getDecision().matchedPermissions());
        return problemDetail;
    }

    @ExceptionHandler(PermissionMatrixUnavailableException.class)
    public ProblemDetail handlePermissionMatrixUnavailable(PermissionMatrixUnavailableException exception, HttpServletRequest request) {
        return buildProblem(
                HttpStatus.SERVICE_UNAVAILABLE,
                "PERMISSION_STORE_UNAVAILABLE",
                exception.getMessage(),
                request,
                URI.create("https://errors.zcorp.internal/iam/permission-store-unavailable"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleMethodArgumentNotValid(MethodArgumentNotValidException exception, HttpServletRequest request) {
        ProblemDetail problemDetail = buildProblem(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST",
                "Request validation failed",
                request,
                URI.create("https://errors.zcorp.internal/iam/invalid-request"));

        Map<String, String> fieldErrors = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        FieldError::getField,
                        fieldError -> Objects.requireNonNullElse(fieldError.getDefaultMessage(), "Invalid value"),
                        (left, _right) -> left,
                        java.util.LinkedHashMap::new));
        problemDetail.setProperty("errors", fieldErrors);
        return problemDetail;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException exception, HttpServletRequest request) {
        return buildProblem(
                HttpStatus.FORBIDDEN,
                "FORBIDDEN",
                Objects.requireNonNullElse(exception.getMessage(), "Access denied"),
                request,
                URI.create("https://errors.zcorp.internal/iam/forbidden"));
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception exception, HttpServletRequest request) {
        return buildProblem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "Unexpected orders-service failure",
                request,
                URI.create("https://errors.zcorp.internal/iam/internal-error"));
    }

    private ProblemDetail buildProblem(
            HttpStatus status,
            String code,
            String detail,
            HttpServletRequest request,
            URI type) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, detail);
        problemDetail.setTitle(status.getReasonPhrase());
        problemDetail.setType(type);
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("code", code);
        problemDetail.setProperty("correlationId", request.getAttribute("correlationId"));

        String traceId = MDC.get("traceId");
        if (traceId != null && !traceId.isBlank()) {
            problemDetail.setProperty("traceId", traceId);
        }

        problemDetail.setProperty("timestamp", OffsetDateTime.now().toString());
        return problemDetail;
    }
}