package com.jdt17.loyalty.constant;

public final class AuditEventConstant {

    private AuditEventConstant() {}

    // Event Types
    public static final String MEMBER_REGISTERED = "MEMBER_REGISTERED";
    public static final String MEMBER_UPDATED = "MEMBER_UPDATED";
    public static final String MEMBER_STATUS_CHANGED = "MEMBER_STATUS_CHANGED";

    public static final String PARTNER_CREATED = "PARTNER_CREATED";
    public static final String PARTNER_UPDATED = "PARTNER_UPDATED";
    public static final String PARTNER_LOGO_UPLOADED = "PARTNER_LOGO_UPLOADED";

    public static final String REWARD_CREATED = "REWARD_CREATED";
    public static final String REWARD_UPDATED = "REWARD_UPDATED";
    public static final String REWARD_IMAGE_UPLOADED = "REWARD_IMAGE_UPLOADED";

    public static final String POINTS_EARNED = "POINTS_EARNED";
    public static final String POINTS_EXCHANGED = "POINTS_EXCHANGED";
    public static final String POINTS_REDEEMED = "POINTS_REDEEMED";
    public static final String POINT_EXPIRED = "POINT_EXPIRED";
    public static final String EXCHANGE_RATE_CREATED = "EXCHANGE_RATE_CREATED";

    // Entity Types
    public static final String ENTITY_MEMBER = "MEMBER";
    public static final String ENTITY_PARTNER = "PARTNER";
    public static final String ENTITY_REWARD = "REWARD";
    public static final String ENTITY_TRANSACTION = "TRANSACTION";
    public static final String ENTITY_EXCHANGE_RATE = "EXCHANGE_RATE";
}
