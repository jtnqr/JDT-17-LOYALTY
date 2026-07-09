package com.jdt17.loyalty.exception;

import lombok.Builder;
import lombok.Getter;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    @Getter
    @Builder
    public static class ErrorResponse {
        private int status;
        private String error;
        private String message;
        private String code;
    }

    @ExceptionHandler(LoyaltyException.class)
    public ResponseEntity<ErrorResponse> handleLoyaltyException(LoyaltyException ex) {
        ErrorResponse response = ErrorResponse.builder()
                .status(ex.getStatus().value())
                .error(ex.getStatus().name())
                .message(ex.getMessage())
                .code(ex.getCode())
                .build();

        return new ResponseEntity<>(response, ex.getStatus());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        ErrorResponse response = ErrorResponse.builder()
                .status(400)
                .error("BAD_REQUEST")
                .message(message)
                .code("VALIDATION_ERROR")
                .build();
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse response = ErrorResponse.builder()
                .status(500)
                .error("INTERNAL_SERVER_ERROR")
                .message(ex.getMessage())
                .code("INTERNAL_ERROR")
                .build();

        return ResponseEntity.internalServerError().body(response);
    }
}
