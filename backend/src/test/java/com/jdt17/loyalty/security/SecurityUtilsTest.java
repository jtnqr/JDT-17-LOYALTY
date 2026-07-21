package com.jdt17.loyalty.security;

import com.jdt17.loyalty.exception.LoyaltyException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Constructor;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SecurityUtilsTest {

    @BeforeEach
    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testPrivateConstructor() throws Exception {
        Constructor<SecurityUtils> constructor = SecurityUtils.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        assertNotNull(constructor.newInstance());
    }

    @Test
    void testGetAuthentication_WhenEmpty_ReturnsNull() {
        assertNull(SecurityUtils.getAuthentication());
        assertNull(SecurityUtils.getCurrentUserIdStr());
        assertNull(SecurityUtils.getCurrentUserId());
        assertFalse(SecurityUtils.hasRole("ADMIN"));
        assertFalse(SecurityUtils.hasRole("ROLE_ADMIN"));
        assertFalse(SecurityUtils.isAdmin());
        assertFalse(SecurityUtils.isMember());
        assertFalse(SecurityUtils.isPartner());
    }

    @Test
    void testGetCurrentUserIdStr_WhenAuthNameIsNull_ReturnsNull() {
        Authentication authWithNullName = new AbstractAuthenticationToken(List.of()) {
            @Override public Object getCredentials() { return null; }
            @Override public Object getPrincipal() { return null; }
            @Override public String getName() { return null; }
        };
        SecurityContextHolder.getContext().setAuthentication(authWithNullName);

        assertNull(SecurityUtils.getCurrentUserIdStr());
        assertNull(SecurityUtils.getCurrentUserId());
    }

    @Test
    void testGetCurrentUserId_WhenAnonymousUser_ReturnsNull() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "anonymousUser", null, List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals("anonymousUser", SecurityUtils.getCurrentUserIdStr());
        assertNull(SecurityUtils.getCurrentUserId());
    }

    @Test
    void testGetCurrentUserId_WhenInvalidUuid_ReturnsNull() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "invalid-uuid-string", null, List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals("invalid-uuid-string", SecurityUtils.getCurrentUserIdStr());
        assertNull(SecurityUtils.getCurrentUserId());
    }

    @Test
    void testGetCurrentUserId_WhenValidUuid_ReturnsUuid() {
        UUID expectedId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                expectedId.toString(), null, List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals(expectedId.toString(), SecurityUtils.getCurrentUserIdStr());
        assertEquals(expectedId, SecurityUtils.getCurrentUserId());
    }

    @Test
    void testGetRequiredCurrentUserId_WhenUnauthenticated_ThrowsUnauthorized() {
        LoyaltyException ex = assertThrows(LoyaltyException.class, SecurityUtils::getRequiredCurrentUserId);
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals("UNAUTHORIZED", ex.getCode());
    }

    @Test
    void testGetRequiredCurrentUserId_WhenAuthNameIsNull_ThrowsUnauthorized() {
        Authentication authWithNullName = new AbstractAuthenticationToken(List.of()) {
            @Override public Object getCredentials() { return null; }
            @Override public Object getPrincipal() { return null; }
            @Override public String getName() { return null; }
        };
        SecurityContextHolder.getContext().setAuthentication(authWithNullName);

        LoyaltyException ex = assertThrows(LoyaltyException.class, SecurityUtils::getRequiredCurrentUserId);
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals("UNAUTHORIZED", ex.getCode());
    }

    @Test
    void testGetRequiredCurrentUserId_WhenAuthenticated_ReturnsUuid() {
        UUID expectedId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                expectedId.toString(), null, List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals(expectedId, SecurityUtils.getRequiredCurrentUserId());
    }

    @Test
    void testHasRole_AllBranches() {
        // 1. auth == null (both with ROLE_ and without ROLE_)
        SecurityContextHolder.clearContext();
        assertFalse(SecurityUtils.hasRole("ADMIN"));
        assertFalse(SecurityUtils.hasRole("ROLE_ADMIN"));

        // 2. auth != null, getAuthorities() == null (MUST override getAuthorities() to return null because AbstractAuthenticationToken converts null to empty list)
        Authentication authNullAuthorities = new AbstractAuthenticationToken(List.of()) {
            @Override public Object getCredentials() { return null; }
            @Override public Object getPrincipal() { return "user"; }
            @Override public Collection<GrantedAuthority> getAuthorities() { return null; }
        };
        SecurityContextHolder.getContext().setAuthentication(authNullAuthorities);
        assertNull(SecurityUtils.getAuthentication().getAuthorities());
        assertFalse(SecurityUtils.hasRole("ADMIN"));
        assertFalse(SecurityUtils.hasRole("ROLE_ADMIN"));

        // 3. auth != null, getAuthorities() is empty (both with ROLE_ and without ROLE_)
        UsernamePasswordAuthenticationToken authEmptyAuthorities = new UsernamePasswordAuthenticationToken(
                "user", null, List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(authEmptyAuthorities);
        assertNotNull(SecurityUtils.getAuthentication().getAuthorities());
        assertTrue(SecurityUtils.getAuthentication().getAuthorities().isEmpty());
        assertFalse(SecurityUtils.hasRole("ADMIN"));
        assertFalse(SecurityUtils.hasRole("ROLE_ADMIN"));

        // 4. auth != null, getAuthorities() has matching role
        UsernamePasswordAuthenticationToken authWithRole = new UsernamePasswordAuthenticationToken(
                "user", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(authWithRole);
        assertTrue(SecurityUtils.hasRole("ADMIN"));
        assertTrue(SecurityUtils.hasRole("ROLE_ADMIN"));

        // 5. auth != null, getAuthorities() has non-matching role
        assertFalse(SecurityUtils.hasRole("MEMBER"));
        assertFalse(SecurityUtils.hasRole("ROLE_MEMBER"));
    }

    @Test
    void testIsRoleHelpers_WhenAuthoritiesIsNull_ReturnsFalse() {
        Authentication authNullAuthorities = new AbstractAuthenticationToken(List.of()) {
            @Override public Object getCredentials() { return null; }
            @Override public Object getPrincipal() { return "user"; }
            @Override public Collection<GrantedAuthority> getAuthorities() { return null; }
        };
        SecurityContextHolder.getContext().setAuthentication(authNullAuthorities);

        assertFalse(SecurityUtils.isAdmin());
        assertFalse(SecurityUtils.isMember());
        assertFalse(SecurityUtils.isPartner());
    }

    @Test
    void testHasRole_MultipleAuthoritiesList() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", null, List.of(
                new SimpleGrantedAuthority("ROLE_USER"),
                new SimpleGrantedAuthority("ROLE_MEMBER"),
                new SimpleGrantedAuthority("ROLE_ADMIN")
        )
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        // First element matches (with and without prefix)
        assertTrue(SecurityUtils.hasRole("USER"));
        assertTrue(SecurityUtils.hasRole("ROLE_USER"));

        // Middle element matches (with and without prefix)
        assertTrue(SecurityUtils.hasRole("MEMBER"));
        assertTrue(SecurityUtils.hasRole("ROLE_MEMBER"));

        // Last element matches (with and without prefix)
        assertTrue(SecurityUtils.hasRole("ADMIN"));
        assertTrue(SecurityUtils.hasRole("ROLE_ADMIN"));

        // Non-matching element (with and without prefix)
        assertFalse(SecurityUtils.hasRole("PARTNER"));
        assertFalse(SecurityUtils.hasRole("ROLE_PARTNER"));

        // Verify helper methods with multiple roles
        assertTrue(SecurityUtils.isAdmin());
        assertTrue(SecurityUtils.isMember());
        assertFalse(SecurityUtils.isPartner());
    }

    @Test
    void testHasRole_NullAuthorityInList() {
        GrantedAuthority nullAuthority = () -> null;
        GrantedAuthority validAuthority = new SimpleGrantedAuthority("ROLE_MEMBER");
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", null, List.of(nullAuthority, validAuthority)
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertTrue(SecurityUtils.hasRole("MEMBER"));
        assertTrue(SecurityUtils.hasRole("ROLE_MEMBER"));
        assertFalse(SecurityUtils.hasRole("ADMIN"));
        assertFalse(SecurityUtils.hasRole("ROLE_ADMIN"));
    }

    @Test
    void testHasRoleAndIsRoleHelpers() {
        UUID userId = UUID.randomUUID();

        // 1. Partner Role
        UsernamePasswordAuthenticationToken partnerAuth = new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))
        );
        SecurityContextHolder.getContext().setAuthentication(partnerAuth);

        assertTrue(SecurityUtils.isPartner());
        assertTrue(SecurityUtils.hasRole("PARTNER"));
        assertTrue(SecurityUtils.hasRole("ROLE_PARTNER"));
        assertFalse(SecurityUtils.isAdmin());
        assertFalse(SecurityUtils.isMember());

        // 2. Admin Role
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        assertTrue(SecurityUtils.isAdmin());
        assertFalse(SecurityUtils.isPartner());
        assertFalse(SecurityUtils.isMember());

        // 3. Member Role
        UsernamePasswordAuthenticationToken memberAuth = new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
        SecurityContextHolder.getContext().setAuthentication(memberAuth);

        assertTrue(SecurityUtils.isMember());
        assertFalse(SecurityUtils.isAdmin());
        assertFalse(SecurityUtils.isPartner());
    }

    @Test
    void testValidateAdminOrSelfAccess() {
        UUID memberId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        // 1. Admin accessing any member -> Success
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                otherId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        assertDoesNotThrow(() -> SecurityUtils.validateAdminOrSelfAccess(memberId));

        // 2. Member accessing self -> Success
        UsernamePasswordAuthenticationToken selfAuth = new UsernamePasswordAuthenticationToken(
                memberId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
        SecurityContextHolder.getContext().setAuthentication(selfAuth);
        assertDoesNotThrow(() -> SecurityUtils.validateAdminOrSelfAccess(memberId));

        // 3. Member accessing other -> Throws Forbidden
        UsernamePasswordAuthenticationToken otherMemberAuth = new UsernamePasswordAuthenticationToken(
                otherId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
        SecurityContextHolder.getContext().setAuthentication(otherMemberAuth);
        LoyaltyException ex1 = assertThrows(LoyaltyException.class, () -> SecurityUtils.validateAdminOrSelfAccess(memberId));
        assertEquals(HttpStatus.FORBIDDEN, ex1.getStatus());
        assertEquals("FORBIDDEN", ex1.getCode());

        // 4. Unauthenticated -> Throws Forbidden
        SecurityContextHolder.clearContext();
        LoyaltyException ex2 = assertThrows(LoyaltyException.class, () -> SecurityUtils.validateAdminOrSelfAccess(memberId));
        assertEquals(HttpStatus.FORBIDDEN, ex2.getStatus());

        // 5. Auth name is null -> Throws Forbidden
        Authentication authWithNullName = new AbstractAuthenticationToken(List.of()) {
            @Override public Object getCredentials() { return null; }
            @Override public Object getPrincipal() { return null; }
            @Override public String getName() { return null; }
        };
        SecurityContextHolder.getContext().setAuthentication(authWithNullName);
        LoyaltyException ex3 = assertThrows(LoyaltyException.class, () -> SecurityUtils.validateAdminOrSelfAccess(memberId));
        assertEquals(HttpStatus.FORBIDDEN, ex3.getStatus());
    }

    @Test
    void testValidateSelfMemberAccessOnly() {
        UUID memberId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        // 1. Member accessing self -> Success
        UsernamePasswordAuthenticationToken memberAuth = new UsernamePasswordAuthenticationToken(
                memberId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
        SecurityContextHolder.getContext().setAuthentication(memberAuth);
        assertDoesNotThrow(() -> SecurityUtils.validateSelfMemberAccessOnly(memberId));

        // 2. Admin attempting to access -> Throws Forbidden
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                memberId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        LoyaltyException ex1 = assertThrows(LoyaltyException.class, () -> SecurityUtils.validateSelfMemberAccessOnly(memberId));
        assertEquals(HttpStatus.FORBIDDEN, ex1.getStatus());

        // 3. Member accessing other member -> Throws Forbidden
        UsernamePasswordAuthenticationToken otherMemberAuth = new UsernamePasswordAuthenticationToken(
                otherId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
        SecurityContextHolder.getContext().setAuthentication(otherMemberAuth);
        LoyaltyException ex2 = assertThrows(LoyaltyException.class, () -> SecurityUtils.validateSelfMemberAccessOnly(memberId));
        assertEquals(HttpStatus.FORBIDDEN, ex2.getStatus());

        // 4. Member role active but name is null -> Throws Forbidden
        Authentication memberAuthWithNullName = new AbstractAuthenticationToken(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))) {
            @Override public Object getCredentials() { return null; }
            @Override public Object getPrincipal() { return null; }
            @Override public String getName() { return null; }
        };
        SecurityContextHolder.getContext().setAuthentication(memberAuthWithNullName);
        LoyaltyException ex3 = assertThrows(LoyaltyException.class, () -> SecurityUtils.validateSelfMemberAccessOnly(memberId));
        assertEquals(HttpStatus.FORBIDDEN, ex3.getStatus());
    }

    @Test
    void testValidatePartnerAccess_WhenPartnerAccessesOwnId_Success() {
        UUID partnerId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken partnerAuth = new UsernamePasswordAuthenticationToken(
                partnerId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))
        );
        SecurityContextHolder.getContext().setAuthentication(partnerAuth);

        assertDoesNotThrow(() -> SecurityUtils.validatePartnerAccess(partnerId));
    }

    @Test
    void testValidatePartnerAccess_WhenPartnerAccessesDifferentId_ThrowsForbidden() {
        UUID partnerId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken partnerAuth = new UsernamePasswordAuthenticationToken(
                partnerId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))
        );
        SecurityContextHolder.getContext().setAuthentication(partnerAuth);

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> SecurityUtils.validatePartnerAccess(otherId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void testValidatePartnerAccess_WhenNonPartnerRole_ThrowsForbidden() {
        UUID partnerId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken memberAuth = new UsernamePasswordAuthenticationToken(
                memberId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
        SecurityContextHolder.getContext().setAuthentication(memberAuth);

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> SecurityUtils.validatePartnerAccess(partnerId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void testValidatePartnerAccess_WhenAdminRole_ThrowsForbidden() {
        UUID partnerId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
                adminId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> SecurityUtils.validatePartnerAccess(partnerId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void testValidatePartnerAccess_WhenCurrentUserIdIsNull_ThrowsForbidden() {
        UUID partnerId = UUID.randomUUID();
        Authentication authWithNullName = new AbstractAuthenticationToken(List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))) {
            @Override public Object getCredentials() { return null; }
            @Override public Object getPrincipal() { return null; }
            @Override public String getName() { return null; }
        };
        SecurityContextHolder.getContext().setAuthentication(authWithNullName);

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> SecurityUtils.validatePartnerAccess(partnerId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void testValidatePartnerAccess_WhenUnauthenticated_ThrowsForbidden() {
        UUID partnerId = UUID.randomUUID();
        SecurityContextHolder.clearContext();

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> SecurityUtils.validatePartnerAccess(partnerId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void testValidatePartnerAccess_WhenPartnerHasMultipleRoles_Success() {
        UUID partnerId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken multiRoleAuth = new UsernamePasswordAuthenticationToken(
                partnerId.toString(), null, List.of(
                        new SimpleGrantedAuthority("ROLE_USER"),
                        new SimpleGrantedAuthority("ROLE_PARTNER")
                )
        );
        SecurityContextHolder.getContext().setAuthentication(multiRoleAuth);

        assertDoesNotThrow(() -> SecurityUtils.validatePartnerAccess(partnerId));
    }
}
