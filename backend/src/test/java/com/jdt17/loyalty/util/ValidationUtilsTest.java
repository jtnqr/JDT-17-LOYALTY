package com.jdt17.loyalty.util;

import com.jdt17.loyalty.constant.ErrorCodeConstant;
import com.jdt17.loyalty.constant.ErrorMessageConstant;
import com.jdt17.loyalty.constant.StatusConstant;
import com.jdt17.loyalty.exception.LoyaltyException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;

class ValidationUtilsTest {

    // ==================== isActive Tests ====================

    @Test
    void testIsActive_WithActiveStatus_ReturnsTrue() {
        boolean result = ValidationUtils.isActive(StatusConstant.ACTIVE);
        assertTrue(result);
    }

    @Test
    void testIsActive_WithInactiveStatus_ReturnsFalse() {
        boolean result = ValidationUtils.isActive(StatusConstant.INACTIVE);
        assertFalse(result);
    }

    @Test
    void testIsActive_WithNullStatus_ReturnsFalse() {
        boolean result = ValidationUtils.isActive(null);
        assertFalse(result);
    }

    @Test
    void testIsActive_WithRandomString_ReturnsFalse() {
        boolean result = ValidationUtils.isActive("RANDOM");
        assertFalse(result);
    }

    @Test
    void testIsActive_WithEmptyString_ReturnsFalse() {
        boolean result = ValidationUtils.isActive("");
        assertFalse(result);
    }

    // ==================== isInactive Tests ====================

    @Test
    void testIsInactive_WithInactiveStatus_ReturnsTrue() {
        boolean result = ValidationUtils.isInactive(StatusConstant.INACTIVE);
        assertTrue(result);
    }

    @Test
    void testIsInactive_WithActiveStatus_ReturnsFalse() {
        boolean result = ValidationUtils.isInactive(StatusConstant.ACTIVE);
        assertFalse(result);
    }

    @Test
    void testIsInactive_WithNullStatus_ReturnsFalse() {
        boolean result = ValidationUtils.isInactive(null);
        assertFalse(result);
    }

    @Test
    void testIsInactive_WithRandomString_ReturnsFalse() {
        boolean result = ValidationUtils.isInactive("RANDOM");
        assertFalse(result);
    }

    @Test
    void testIsInactive_WithEmptyString_ReturnsFalse() {
        boolean result = ValidationUtils.isInactive("");
        assertFalse(result);
    }

    // ==================== validateActive Tests ====================

    @Test
    void testValidateActive_WithActiveStatus_DoesNotThrow() {
        assertDoesNotThrow(() ->
            ValidationUtils.validateActive(null, StatusConstant.ACTIVE, HttpStatus.BAD_REQUEST,
                ErrorMessageConstant.MEMBER_INACTIVE, ErrorCodeConstant.MEMBER_INACTIVE)
        );
    }

    @Test
    void testValidateActive_WithInactiveStatus_ThrowsException() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validateActive(null, StatusConstant.INACTIVE, HttpStatus.BAD_REQUEST,
                ErrorMessageConstant.MEMBER_INACTIVE, ErrorCodeConstant.MEMBER_INACTIVE)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorMessageConstant.MEMBER_INACTIVE, exception.getMessage());
        assertEquals(ErrorCodeConstant.MEMBER_INACTIVE, exception.getCode());
    }

    @Test
    void testValidateActive_WithNullStatus_ThrowsException() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validateActive(null, null, HttpStatus.BAD_REQUEST,
                ErrorMessageConstant.MEMBER_INACTIVE, ErrorCodeConstant.MEMBER_INACTIVE)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    @Test
    void testValidateActive_WithNotFoundStatus_ThrowsNotFoundException() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validateActive(null, StatusConstant.INACTIVE, HttpStatus.NOT_FOUND,
                ErrorMessageConstant.REWARD_INACTIVE, ErrorCodeConstant.REWARD_INACTIVE)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals(ErrorMessageConstant.REWARD_INACTIVE, exception.getMessage());
    }

    // ==================== validateInactive Tests ====================

    @Test
    void testValidateInactive_WithInactiveStatus_DoesNotThrow() {
        assertDoesNotThrow(() ->
            ValidationUtils.validateInactive(null, StatusConstant.INACTIVE, HttpStatus.BAD_REQUEST,
                "Test message", "TEST_CODE")
        );
    }

    @Test
    void testValidateInactive_WithActiveStatus_ThrowsException() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validateInactive(null, StatusConstant.ACTIVE, HttpStatus.BAD_REQUEST,
                "Test message", "TEST_CODE")
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("Test message", exception.getMessage());
        assertEquals("TEST_CODE", exception.getCode());
    }

    @Test
    void testValidateInactive_WithNullStatus_ThrowsException() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validateInactive(null, null, HttpStatus.BAD_REQUEST,
                "Test message", "TEST_CODE")
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    // ==================== validateMemberActive Tests ====================

    @Test
    void testValidateMemberActive_WithActiveStatus_DoesNotThrow() {
        assertDoesNotThrow(() -> ValidationUtils.validateMemberActive(StatusConstant.ACTIVE));
    }

    @Test
    void testValidateMemberActive_WithInactiveStatus_ThrowsBadRequest() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validateMemberActive(StatusConstant.INACTIVE)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorMessageConstant.MEMBER_INACTIVE, exception.getMessage());
        assertEquals(ErrorCodeConstant.MEMBER_INACTIVE, exception.getCode());
    }

    @Test
    void testValidateMemberActive_WithNullStatus_ThrowsBadRequest() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validateMemberActive(null)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    // ==================== validatePartnerActive Tests ====================

    @Test
    void testValidatePartnerActive_WithActiveStatus_DoesNotThrow() {
        assertDoesNotThrow(() -> ValidationUtils.validatePartnerActive(StatusConstant.ACTIVE));
    }

    @Test
    void testValidatePartnerActive_WithInactiveStatus_ThrowsBadRequest() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validatePartnerActive(StatusConstant.INACTIVE)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorMessageConstant.PARTNER_INACTIVE, exception.getMessage());
        assertEquals(ErrorCodeConstant.PARTNER_INACTIVE, exception.getCode());
    }

    @Test
    void testValidatePartnerActive_WithNullStatus_ThrowsBadRequest() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validatePartnerActive(null)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    }

    // ==================== validateRewardActive Tests ====================

    @Test
    void testValidateRewardActive_WithActiveStatus_DoesNotThrow() {
        assertDoesNotThrow(() -> ValidationUtils.validateRewardActive(StatusConstant.ACTIVE));
    }

    @Test
    void testValidateRewardActive_WithInactiveStatus_ThrowsNotFound() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validateRewardActive(StatusConstant.INACTIVE)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals(ErrorMessageConstant.REWARD_INACTIVE, exception.getMessage());
        assertEquals(ErrorCodeConstant.REWARD_INACTIVE, exception.getCode());
    }

    @Test
    void testValidateRewardActive_WithNullStatus_ThrowsNotFound() {
        LoyaltyException exception = assertThrows(LoyaltyException.class, () ->
            ValidationUtils.validateRewardActive(null)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }
}
