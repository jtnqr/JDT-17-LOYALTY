package com.jdt17.loyalty.service;

import java.util.UUID;

public interface AuditTrailService {
    void logEvent(String eventType, UUID actorId, String actorType, String entityType, UUID entityId, Object payload);
}
