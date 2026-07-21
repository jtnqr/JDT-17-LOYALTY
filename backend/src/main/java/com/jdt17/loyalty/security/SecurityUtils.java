package com.jdt17.loyalty.security;

import com.jdt17.loyalty.constant.ErrorCodeConstant;
import com.jdt17.loyalty.constant.ErrorMessageConstant;
import com.jdt17.loyalty.constant.RoleConstant;
import com.jdt17.loyalty.exception.LoyaltyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    public static String getCurrentUserIdStr() {
        Authentication auth = getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return auth.getName();
    }

    public static UUID getCurrentUserId() {
        String idStr = getCurrentUserIdStr();
        if (idStr == null || "anonymousUser".equals(idStr)) {
            return null;
        }
        try {
            return UUID.fromString(idStr);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public static UUID getRequiredCurrentUserId() {
        UUID id = getCurrentUserId();
        if (id == null) {
            throw new LoyaltyException(HttpStatus.UNAUTHORIZED, ErrorMessageConstant.UNAUTHORIZED, ErrorCodeConstant.UNAUTHORIZED);
        }
        return id;
    }

    public static boolean hasRole(String role) {
        Authentication auth = getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return auth.getAuthorities().stream()
                .anyMatch(a -> roleWithPrefix.equals(a.getAuthority()));
    }

    public static boolean isAdmin() {
        return hasRole(RoleConstant.ROLE_ADMIN);
    }

    public static boolean isMember() {
        return hasRole(RoleConstant.ROLE_MEMBER);
    }

    public static boolean isPartner() {
        return hasRole(RoleConstant.ROLE_PARTNER);
    }




    public static void validateAdminOrSelfAccess(UUID memberId) {
        String currentUserId = getCurrentUserIdStr();
        boolean isAdmin = isAdmin();
        if (!isAdmin && (currentUserId == null || !memberId.toString().equals(currentUserId))) {
            throw new LoyaltyException(HttpStatus.FORBIDDEN, ErrorMessageConstant.FORBIDDEN, ErrorCodeConstant.FORBIDDEN);
        }
    }

    public static void validateSelfMemberAccessOnly(UUID memberId) {
        String currentUserId = getCurrentUserIdStr();
        boolean isMember = isMember();
        if (!isMember || currentUserId == null || !memberId.toString().equals(currentUserId)) {
            throw new LoyaltyException(HttpStatus.FORBIDDEN, ErrorMessageConstant.FORBIDDEN, ErrorCodeConstant.FORBIDDEN);
        }
    }

    public static void validatePartnerAccess(UUID partnerId) {
        String currentPartnerId = getCurrentUserIdStr();
        boolean isPartnerRole = isPartner();

        if (!isPartnerRole || currentPartnerId == null || !partnerId.toString().equals(currentPartnerId)) {
            throw new LoyaltyException(HttpStatus.FORBIDDEN, ErrorMessageConstant.FORBIDDEN, ErrorCodeConstant.FORBIDDEN);
        }
    }
}
