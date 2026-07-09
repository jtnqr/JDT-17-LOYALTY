package com.jdt17.loyalty.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JWTService jwtService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testDoFilterInternal_NoAuthHeader() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testDoFilterInternal_InvalidHeaderFormat() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("InvalidFormat");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testDoFilterInternal_Success() throws ServletException, IOException {
        String token = "validToken";
        String userId = "user-uuid";
        String role = "MEMBER";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.extractSubject(token)).thenReturn(userId);
        when(jwtService.extractClaim(eq(token), any(java.util.function.Function.class)))
                .thenAnswer(invocation -> {
                    java.util.function.Function<io.jsonwebtoken.Claims, String> resolver = invocation.getArgument(1);
                    io.jsonwebtoken.Claims claims = mock(io.jsonwebtoken.Claims.class);
                    when(claims.get("role", String.class)).thenReturn(role);
                    return resolver.apply(claims);
                });
        when(jwtService.isTokenValid(token, userId)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(userId, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        assertEquals("ROLE_MEMBER", SecurityContextHolder.getContext().getAuthentication().getAuthorities().iterator().next().getAuthority());
    }

    @Test
    void testDoFilterInternal_InvalidToken() throws ServletException, IOException {
        String token = "invalidToken";
        String userId = "user-uuid";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.extractSubject(token)).thenReturn(userId);
        when(jwtService.extractClaim(eq(token), any(java.util.function.Function.class)))
                .thenAnswer(invocation -> {
                    java.util.function.Function<io.jsonwebtoken.Claims, String> resolver = invocation.getArgument(1);
                    io.jsonwebtoken.Claims claims = mock(io.jsonwebtoken.Claims.class);
                    when(claims.get("role", String.class)).thenReturn("MEMBER");
                    return resolver.apply(claims);
                });
        when(jwtService.isTokenValid(token, userId)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testDoFilterInternal_ExceptionThrown() throws ServletException, IOException {
        String token = "errorToken";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.extractSubject(token)).thenThrow(new RuntimeException("JWT error"));

        filter.doFilterInternal(request, response, filterChain);

        // Filter should catch exception and proceed with chain
        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testDoFilterInternal_UserIdNull() throws ServletException, IOException {
        String token = "validToken";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.extractSubject(token)).thenReturn(null);
        when(jwtService.extractClaim(eq(token), any(java.util.function.Function.class)))
                .thenReturn("MEMBER");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testDoFilterInternal_AuthenticationAlreadyPresent() throws ServletException, IOException {
        String token = "validToken";
        String userId = "user-uuid";

        // Pre-populate Security Context with an existing authentication
        org.springframework.security.core.Authentication existingAuth = mock(org.springframework.security.core.Authentication.class);
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.extractSubject(token)).thenReturn(userId);
        when(jwtService.extractClaim(eq(token), any(java.util.function.Function.class)))
                .thenReturn("MEMBER");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        // Authentication should remain the existing one, not replaced
        assertSame(existingAuth, SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testDoFilterInternal_NonNullParameters() {
        assertThrows(NullPointerException.class, () ->
                filter.doFilterInternal(null, response, filterChain)
        );
        assertThrows(NullPointerException.class, () ->
                filter.doFilterInternal(request, null, filterChain)
        );
        assertThrows(NullPointerException.class, () ->
                filter.doFilterInternal(request, response, null)
        );
    }
}
