package com.jdt17.loyalty.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jdt17.loyalty.entity.AuditTrail;
import com.jdt17.loyalty.repository.AuditTrailRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
@Slf4j
public class AuditTrailService {
    private final AuditTrailRepository auditTrailRepository;
    private final ObjectMapper objectMapper;

    public AuditTrailService(AuditTrailRepository auditTrailRepository) {
        this.auditTrailRepository = auditTrailRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void logEvent(String eventType, UUID actorId, String actorType, String entityType, UUID entityId, Object payload) {
        try {
            String jsonPayload = null;
            if (payload != null) {
                if (payload instanceof String) {
                    String strPayload = (String) payload;
                    if ((strPayload.trim().startsWith("{") && strPayload.trim().endsWith("}")) ||
                        (strPayload.trim().startsWith("[") && strPayload.trim().endsWith("]"))) {
                        jsonPayload = sanitizeJsonString(strPayload);
                    } else {
                        jsonPayload = objectMapper.writeValueAsString(sanitizeValue(strPayload));
                    }
                } else {
                    jsonPayload = objectMapper.writeValueAsString(sanitizeObject(payload));
                }
            }

            AuditTrail auditTrail = AuditTrail.builder()
                    .eventType(eventType)
                    .actorId(actorId)
                    .actorType(actorType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .payload(jsonPayload)
                    .build();

            auditTrailRepository.save(auditTrail);
            log.info("Audit log saved successfully. EventType: {}, EntityType: {}, EntityId: {}", eventType, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to write audit trail for EventType: {}, EntityType: {}, EntityId: {}", eventType, entityType, entityId, e);
            throw new RuntimeException("Failed to write audit trail log", e);
        }
    }

    private String sanitizeJsonString(String jsonStr) {
        if (!containsSensitiveKeys(jsonStr)) {
            return jsonStr;
        }
        try {
            Object parsed = objectMapper.readValue(jsonStr, Object.class);
            Object sanitized = sanitizeObject(parsed);
            return objectMapper.writeValueAsString(sanitized);
        } catch (Exception e) {
            return jsonStr;
        }
    }

    protected String sanitizeJsonStringForTesting(String jsonStr) {
        return sanitizeJsonString(jsonStr);
    }

    private boolean containsSensitiveKeys(String str) {
        if (str == null) {
            return false;
        }
        String lower = str.toLowerCase();
        return lower.contains("password") ||
               lower.contains("apikey") ||
               lower.contains("api_key") ||
               lower.contains("secret") ||
               lower.contains("token");
    }

    protected boolean logEventContainsSensitiveKeysForTesting(String str) {
        return containsSensitiveKeys(str);
    }

    private Object sanitizeObject(Object obj) {
        if (obj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) obj;
            Map<String, Object> sanitized = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                String key = String.valueOf(entry.getKey());
                sanitized.put(key, sanitizeValue(key, entry.getValue()));
            }
            return sanitized;
        }
        if (obj instanceof java.util.List) {
            java.util.List<?> list = (java.util.List<?>) obj;
            java.util.List<Object> sanitized = new java.util.ArrayList<>();
            for (Object item : list) {
                sanitized.add(sanitizeObject(item));
            }
            return sanitized;
        }
        return obj;
    }

    private Object sanitizeValue(String key, Object value) {
        if (value == null) {
            return null;
        }
        if (isKeySensitive(key)) {
            return "******";
        }
        if (value instanceof Map || value instanceof java.util.List) {
            return sanitizeObject(value);
        }
        return value;
    }

    private boolean isKeySensitive(String key) {
        if (key == null) {
            return false;
        }
        String lowerKey = key.toLowerCase();
        return lowerKey.contains("password") ||
               lowerKey.contains("apikey") ||
               lowerKey.contains("api_key") ||
               lowerKey.contains("secret") ||
               lowerKey.contains("token");
    }

    protected boolean isKeySensitiveForTesting(String key) {
        return isKeySensitive(key);
    }

    private Object sanitizeValue(String value) {
        if (value == null) {
            return null;
        }
        return value;
    }

    protected Object sanitizeValueForTesting(String value) {
        return sanitizeValue(value);
    }
}
