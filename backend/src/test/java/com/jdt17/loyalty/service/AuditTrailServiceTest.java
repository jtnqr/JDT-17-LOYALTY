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
import java.util.Map;
import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditTrailServiceTest {

    @Mock
    private AuditTrailRepository auditTrailRepository;

    private AuditTrailService auditTrailService;

    @BeforeEach
    void setUp() {
        auditTrailService = new AuditTrailService(auditTrailRepository);
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
    void testLogEvent_Success_WithPlainStringPayload() {
        // Arrange
        String eventType = "MEMBER_REGISTERED";
        UUID actorId = UUID.randomUUID();
        String actorType = "SYSTEM";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();
        String payload = "plain text message";

        // Act
        auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, payload);

        // Assert
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository, times(1)).save(captor.capture());

        AuditTrail saved = captor.getValue();
        assertNotNull(saved);
        assertEquals("\"plain text message\"", saved.getPayload());
    }

    @Test
    void testLogEvent_Success_WithArrayStringPayload() {
        // Arrange
        String eventType = "MEMBER_REGISTERED";
        UUID actorId = UUID.randomUUID();
        String actorType = "SYSTEM";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();
        String payload = "[\"item1\", \"item2\"]";

        // Act
        auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, payload);

        // Assert
        ArgumentCaptor<ArgumentCaptor> verifyMock = mock(ArgumentCaptor.class); // dummy
        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository, times(1)).save(captor.capture());

        AuditTrail saved = captor.getValue();
        assertNotNull(saved);
        assertEquals(payload, saved.getPayload());
    }

    @Test
    void testLogEvent_Success_WithPartialJsonStringPayload() {
        // Arrange
        String eventType = "MEMBER_REGISTERED";
        UUID actorId = UUID.randomUUID();
        String actorType = "SYSTEM";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();
        
        String[] partialPayloads = {
            "{bad json",
            "[bad json",
            "bad json}",
            "bad json]"
        };

        for (String payload : partialPayloads) {
            // Act
            auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, payload);
        }

        // Assert
        verify(auditTrailRepository, times(partialPayloads.length)).save(any(AuditTrail.class));
    }

    @Test
    void testLogEvent_Failure_SerializationError() {
        // Arrange
        String eventType = "MEMBER_REGISTERED";
        UUID actorId = UUID.randomUUID();
        String actorType = "SYSTEM";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();
        Object badPayload = new Object() {
            public String getValue() {
                throw new RuntimeException("Serialization failed");
            }
        };

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> 
            auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, badPayload)
        );

        assertTrue(exception.getMessage().contains("Failed to write audit trail log"));
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

    @Test
    void testLogEvent_Success_SanitizeSensitiveStringPayload() {
        String eventType = "MEMBER_REGISTERED";
        UUID actorId = UUID.randomUUID();
        String actorType = "SYSTEM";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();
        String payload = "{\"password\": \"secret123\", \"email\": \"test@test.com\", \"nested\": {\"api_key\": \"key123\"}}";

        auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, payload);

        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());
        String result = captor.getValue().getPayload();
        assertTrue(result.contains("\"password\":\"******\""));
        assertTrue(result.contains("\"email\":\"test@test.com\""));
        assertTrue(result.contains("\"api_key\":\"******\""));
    }

    @Test
    void testLogEvent_Success_SanitizeMapObjectPayload() {
        String eventType = "MEMBER_REGISTERED";
        UUID actorId = UUID.randomUUID();
        String actorType = "SYSTEM";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();

        Map<String, Object> payload = new HashMap<>();
        payload.put("password", "secret123");
        payload.put("email", "test@test.com");
        payload.put("nullKey", null);
        payload.put("apikey", "key123");
        payload.put("secret", "val");
        payload.put("token", "val");
        
        Map<String, Object> nested = new HashMap<>();
        nested.put("apiKey", "key123");
        nested.put("list", List.of("a", "b"));
        payload.put("nested", nested);

        // Edge case coverages for key validation
        payload.put(null, "nullValue");

        auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, payload);

        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());
        String result = captor.getValue().getPayload();
        assertTrue(result.contains("\"password\":\"******\""));
        assertTrue(result.contains("\"email\":\"test@test.com\""));
        assertTrue(result.contains("\"apiKey\":\"******\""));
        
        // Directly test isKeySensitive(null) coverage
        assertFalse(auditTrailService.isKeySensitiveForTesting(null));
    }

    @Test
    void testLogEvent_Success_SanitizeListObjectPayload() {
        String eventType = "MEMBER_REGISTERED";
        UUID actorId = UUID.randomUUID();
        String actorType = "SYSTEM";
        String entityType = "MEMBER";
        UUID entityId = UUID.randomUUID();

        List<Object> payload = List.of("plainValue", Map.of("password", "secret123"));

        auditTrailService.logEvent(eventType, actorId, actorType, entityType, entityId, payload);

        ArgumentCaptor<AuditTrail> captor = ArgumentCaptor.forClass(AuditTrail.class);
        verify(auditTrailRepository).save(captor.capture());
        String result = captor.getValue().getPayload();
        assertTrue(result.contains("\"password\":\"******\""));
    }

    @Test
    void testLogEvent_Success_ContainsSensitiveKeys_EdgeCases() {
        assertFalse(auditTrailService.logEventContainsSensitiveKeysForTesting(null));
        assertTrue(auditTrailService.logEventContainsSensitiveKeysForTesting("api_key"));
        assertTrue(auditTrailService.logEventContainsSensitiveKeysForTesting("apikey"));
        assertTrue(auditTrailService.logEventContainsSensitiveKeysForTesting("secret"));
        assertTrue(auditTrailService.logEventContainsSensitiveKeysForTesting("token"));
        
        assertNull(auditTrailService.sanitizeJsonStringForTesting(null));
        assertEquals("bad-json", auditTrailService.sanitizeJsonStringForTesting("bad-json"));
        // Force JSON parse exception to cover catch block
        assertEquals("{invalid json api_key", auditTrailService.sanitizeJsonStringForTesting("{invalid json api_key"));
    }

    @Test
    void testLogEvent_Success_SanitizeValue_EdgeCases() {
        assertNull(auditTrailService.sanitizeValueForTesting(null));
        assertEquals("normal-value", auditTrailService.sanitizeValueForTesting("normal-value"));
    }
}
