package com.jdt17.loyalty.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Date;
import static org.mockito.Mockito.*;

import static org.junit.jupiter.api.Assertions.*;

class JWTServiceTest {

    private JWTService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JWTService();
        // Set secret key and expiration using ReflectionTestUtils
        ReflectionTestUtils.setField(jwtService, "secretKey", "change-this-secret-in-production-must-be-at-least-256-bits-long-placeholder");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L); // 24 hours
    }

    @Test
    void testGenerateTokenAndExtractClaims() {
        String subject = "user-uuid";
        String role = "MEMBER";

        String token = jwtService.generateToken(subject, role);

        assertNotNull(token);
        assertEquals(subject, jwtService.extractSubject(token));
        assertEquals(role, jwtService.extractClaim(token, claims -> claims.get("role", String.class)));
        assertTrue(jwtService.isTokenValid(token, subject));
    }

    @Test
    void testGeneratePartnerToken() {
        String partnerId = "partner-uuid";

        String token = jwtService.generatePartnerToken(partnerId);

        assertNotNull(token);
        assertEquals(partnerId, jwtService.extractSubject(token));
        assertEquals("PARTNER", jwtService.extractClaim(token, claims -> claims.get("role", String.class)));
        assertTrue(jwtService.isTokenValid(token, partnerId));
    }

    @Test
    void testIsTokenValid_InvalidSubject() {
        String subject = "user-uuid";
        String token = jwtService.generateToken(subject, "MEMBER");

        assertFalse(jwtService.isTokenValid(token, "different-uuid"));
    }

    @Test
    void testIsTokenExpired() {
        // Set expiration to a negative value to force expiration
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1000L);

        String token = jwtService.generateToken("user-uuid", "MEMBER");

        // Extracting claim from expired token should throw ExpiredJwtException
        assertThrows(ExpiredJwtException.class, () -> jwtService.extractSubject(token));
    }

    @Test
    void testIsTokenValid_ExpiredToken() {
        JWTService spyService = spy(jwtService);

        // Stub extractSubject to return a valid subject
        doReturn("user-uuid").when(spyService).extractSubject(anyString());

        // Stub extractClaim for expiration to return a past date (expired)
        doReturn(new Date(System.currentTimeMillis() - 10000))
                .when(spyService).extractClaim(anyString(), any());

        // Now, isTokenValid should return false because isTokenExpired will be true
        assertFalse(spyService.isTokenValid("someToken", "user-uuid"));
    }
}
