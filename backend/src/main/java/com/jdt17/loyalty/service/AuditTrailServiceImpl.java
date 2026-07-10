package com.jdt17.loyalty.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jdt17.loyalty.entity.AuditTrail;
import com.jdt17.loyalty.repository.AuditTrailRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Slf4j
public class AuditTrailServiceImpl implements AuditTrailService {
    private final AuditTrailRepository auditTrailRepository;
    private final ObjectMapper objectMapper;

    public AuditTrailServiceImpl(AuditTrailRepository auditTrailRepository) {
        this.auditTrailRepository = auditTrailRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void logEvent(String eventType, UUID actorId, String actorType, String entityType, UUID entityId, Object payload) {
        try {
            String jsonPayload = null;
            if (payload != null) {
                if (payload instanceof String) {
                    String strPayload = (String) payload;
                    if ((strPayload.trim().startsWith("{") && strPayload.trim().endsWith("}")) ||
                        (strPayload.trim().startsWith("[") && strPayload.trim().endsWith("]"))) {
                        jsonPayload = strPayload;
                    } else {
                        jsonPayload = objectMapper.writeValueAsString(strPayload);
                    }
                } else {
                    jsonPayload = objectMapper.writeValueAsString(payload);
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
}
