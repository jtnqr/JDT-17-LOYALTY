package com.jdt17.loyalty.dto.login;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class LoginResponse {
    private String token;
    private String role;
    private UserDetails user;

    @Getter
    @Builder
    public static class UserDetails {
        private UUID id;
        private String name;
        private String email;
        private String status;
    }
}
