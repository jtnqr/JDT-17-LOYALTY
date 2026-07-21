package com.jdt17.loyalty.constant;

public final class ErrorMessageConstant {
    private ErrorMessageConstant() {}

    public static final String MEMBER_NOT_FOUND = "Member does not exist";
    public static final String MEMBER_INACTIVE = "Member status is INACTIVE";
    public static final String PARTNER_NOT_FOUND = "Partner does not exist";
    public static final String PARTNER_INACTIVE = "Partner status is INACTIVE";
    public static final String REWARD_NOT_FOUND = "Reward does not exist";
    public static final String REWARD_INACTIVE = "Reward is not ACTIVE";
    public static final String INSUFFICIENT_BALANCE = "Not enough points";
    public static final String EXCHANGE_RATE_NOT_CONFIGURED = "No rate for partner pair";
    public static final String INVALID_CREDENTIALS = "Invalid credentials";
    public static final String INVALID_PARTNER_CREDENTIALS = "Invalid partner credentials";
    public static final String INVALID_API_KEY = "Invalid API key";
    public static final String UNAUTHORIZED = "Missing or invalid token";
    public static final String FORBIDDEN = "Access denied";
    public static final String DUPLICATE_EMAIL = "Email already registered";
    public static final String DUPLICATE_PHONE = "Phone number already registered";
    public static final String DUPLICATE_PARTNER_CODE = "Partner code already exists";
    public static final String INVALID_EXCHANGE_RATE_PAIR = "fromPartnerId equals toPartnerId";
    public static final String DUPLICATE_EXCHANGE_RATE = "Same pair + effectiveFrom already exists";
    public static final String INVALID_TRANSACTION_TYPE = "Invalid transaction type";
    public static final String REWARD_ID_REQUIRED = "Reward ID is required";
    public static final String NO_POINT_BALANCE_PARTNER = "No point balance for this partner";
    public static final String NO_POINT_BALANCE_SOURCE_PARTNER = "No point balance for source partner";
    public static final String NO_POINT_BALANCE_TARGET_PARTNER = "No point balance for target partner";
    public static final String PARTNER_IDS_REQUIRED = "From and To Partner IDs are required";
    public static final String POINTS_MUST_POSITIVE = "Points must be greater than 0";
    public static final String SOURCE_PARTNER_NOT_FOUND = "Source partner does not exist";
    public static final String TARGET_PARTNER_NOT_FOUND = "Target partner does not exist";
    public static final String SOURCE_PARTNER_INACTIVE = "Source partner is INACTIVE";
    public static final String TARGET_PARTNER_INACTIVE = "Target partner is INACTIVE";
}
