package com.jdt17.loyalty.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jdt17.loyalty.entity.AuditTrail;
import com.jdt17.loyalty.repository.AuditTrailRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditTrailServiceTest {

    @Mock
    private AuditTrailRepository auditTrailRepository;

    private AuditTrailService auditTrailService;

    @BeforeEach
    void setUp() {
        auditTrailService = new AuditTrailServiceImpl(auditTrailRepository);
    }

    @Test
    void testLogEvent_Success_WithStringPayload() {
        // Arrange
        String eventType = "MEMBER_REGISTERED";
        UUID actorId = UUID.randomUUID();
        String actorType = "SYSTEM";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();
        String payload = "{\"status\": \"ACTIVE\"}";

        // Act
        auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, payload);

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository, times(1)).save(captor.capture());

        AuditTrail saved = captor.getValue();
        assertNotNull(saved);
        assertEquals(eventType, saved.getEventType());
        assertEquals(actorId, saved.getActorId());
        assertEquals(actorType, saved.getActorType());
        assertEquals(entityType, saved.getEntityType());
        assertEquals(entityId, saved.getEntityId());
        assertEquals(payload, saved.getPayload());
    }

    @Test
    void testLogEvent_Success_WithObjectPayload() {
        // Arrange
        String eventType = "MEMBER_UPDATED";
        UUID actorId = UUID.randomUUID();
        String actorType = "ADMIN";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();
        
        class MockPayload {
            public final String name = "Test User";
        }
        MockPayload payload = new MockPayload();

        // Act
        auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, payload);

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository, times(1)).save(captor.capture());

        AuditTrail saved = captor.getValue();
        assertNotNull(saved);
        assertEquals(eventType, saved.getEventType());
        assertEquals(actorId, saved.getActorId());
        assertEquals(actorType, saved.getActorType());
        assertEquals(entityType, saved.getEntityType());
        assertEquals(entityId, saved.getEntityId());
        assertTrue(saved.getPayload().contains("Test User"));
    }

    @Test
    void testLogEvent_Success_WithNullPayload() {
        // Arrange
        String eventType = "MEMBER_UPDATED";
        UUID actorId = UUID.randomUUID();
        String actorType = "ADMIN";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();

        // Act
        auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, null);

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository, times(1)).save(captor.capture());

        AuditTrail saved = captor.getValue();
        assertNotNull(saved);
        assertEquals(eventType, saved.getEventType());
        assertNull(saved.getPayload());
    }

    @Test
    void testLogEvent_Failure_ExceptionThrown() {
        // Arrange
        String eventType = "MEMBER_REGISTERED";
        UUID actorId = UUID.randomUUID();
        String actorType = "SYSTEM";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();

        when(auditTrailRepository.save(any(AuditTrail.class)))
                .thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
            auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, null)
        );

        assertTrue(exception.getMessage().contains("Failed to write audit trail log"));
    }
}
