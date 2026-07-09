package com.jdt17.loyalty.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class LoyaltyException extends RuntimeException{
    private final HttpStatus status;
    private final String code;

    public LoyaltyException(HttpStatus status, String message, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
