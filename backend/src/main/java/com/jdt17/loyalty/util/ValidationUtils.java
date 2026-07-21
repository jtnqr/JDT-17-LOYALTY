package com.jdt17.loyalty.util;

import com.jdt17.loyalty.constant.ErrorCodeConstant;
import com.jdt17.loyalty.constant.ErrorMessageConstant;
import com.jdt17.loyalty.constant.StatusConstant;
import com.jdt17.loyalty.exception.LoyaltyException;
import org.springframework.http.HttpStatus;

public final class ValidationUtils {

    private ValidationUtils() {}

    /**
     * Checks if status is ACTIVE
     */
    public static boolean isActive(String status) {
        if (status == null) {
            return false;
        }
        return StatusConstant.ACTIVE.equals(status);
    }

    /**
     * Checks if status is INACTIVE
     */
    public static boolean isInactive(String status) {
        if (status == null) {
            return false;
        }
        return StatusConstant.INACTIVE.equals(status);
    }

    /**
     * Validates that entity status is ACTIVE, throws exception if not
     */
    public static void validateActive(Object entity, String status, HttpStatus httpStatus, String errorMessage, String errorCode) {
        if (!isActive(status)) {
            throw new LoyaltyException(httpStatus, errorMessage, errorCode);
        }
    }

    /**
     * Validates that entity status is INACTIVE, throws exception if not
     */
    public static void validateInactive(Object entity, String status, HttpStatus httpStatus, String errorMessage, String errorCode) {
        if (!isInactive(status)) {
            throw new LoyaltyException(httpStatus, errorMessage, errorCode);
        }
    }

    /**
     * Validates that member is ACTIVE (BAD_REQUEST if not)
     */
    public static void validateMemberActive(String status) {
        validateActive(null, status, HttpStatus.BAD_REQUEST, ErrorMessageConstant.MEMBER_INACTIVE, ErrorCodeConstant.MEMBER_INACTIVE);
    }

    /**
     * Validates that partner is ACTIVE (BAD_REQUEST if not)
     */
    public static void validatePartnerActive(String status) {
        validateActive(null, status, HttpStatus.BAD_REQUEST, ErrorMessageConstant.PARTNER_INACTIVE, ErrorCodeConstant.PARTNER_INACTIVE);
    }

    /**
     * Validates that reward is ACTIVE (NOT_FOUND if not)
     */
    public static void validateRewardActive(String status) {
        validateActive(null, status, HttpStatus.NOT_FOUND, ErrorMessageConstant.REWARD_INACTIVE, ErrorCodeConstant.REWARD_INACTIVE);
    }
}

