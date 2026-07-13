package com.jdt17.loyalty.service;

import com.jdt17.loyalty.exception.LoyaltyException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ImageStorageServiceTest {

    private ImageStorageService imageStorageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        imageStorageService = new ImageStorageService();
        ReflectionTestUtils.setField(imageStorageService, "uploadDir", tempDir.toString());
    }

    @Test
    void testStore_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "image", "pic.png", "image/png", "some_bytes".getBytes()
        );

        String result = imageStorageService.store(file, "rewards");

        assertNotNull(result);
        assertTrue(result.startsWith("/uploads/rewards/"));
        assertTrue(result.endsWith(".png"));

        // Check if file actually exists on disk
        String relative = result.replaceFirst("^/uploads/", "");
        Path savedFile = tempDir.resolve(relative);
        assertTrue(Files.exists(savedFile));
        assertEquals("some_bytes", Files.readString(savedFile));
    }

    @Test
    void testStore_InvalidType() {
        MockMultipartFile file = new MockMultipartFile(
                "image", "pic.txt", "text/plain", "some_bytes".getBytes()
        );

        LoyaltyException ex = assertThrows(LoyaltyException.class, () ->
                imageStorageService.store(file, "rewards")
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_FILE_TYPE", ex.getCode());
    }

    @Test
    void testStore_FileTooLarge() {
        // Exceeds 2MB limit (2 * 1024 * 1024 + 1 bytes)
        byte[] largeBytes = new byte[2 * 1024 * 1024 + 1];
        MockMultipartFile file = new MockMultipartFile(
                "image", "pic.jpg", "image/jpeg", largeBytes
        );

        LoyaltyException ex = assertThrows(LoyaltyException.class, () ->
                imageStorageService.store(file, "rewards")
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("FILE_TOO_LARGE", ex.getCode());
    }

    @Test
    void testDelete_Success() throws IOException {
        Path subfolder = tempDir.resolve("rewards");
        Files.createDirectories(subfolder);
        Path testFile = subfolder.resolve("test-image.jpg");
        Files.writeString(testFile, "chicken");

        assertTrue(Files.exists(testFile));

        imageStorageService.delete("/uploads/rewards/test-image.jpg");

        assertFalse(Files.exists(testFile));
    }

    @Test
    void testDelete_InvalidPath() {
        // Should not fail, just return silently
        assertDoesNotThrow(() -> imageStorageService.delete("/other/rewards/test-image.jpg"));
        assertDoesNotThrow(() -> imageStorageService.delete(null));
    }

    @Test
    void testStore_NullContentType() {
        MockMultipartFile file = new MockMultipartFile(
                "image", "pic", null, "some_bytes".getBytes()
        );

        LoyaltyException ex = assertThrows(LoyaltyException.class, () ->
                imageStorageService.store(file, "rewards")
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_FILE_TYPE", ex.getCode());
    }

    @Test
    void testDelete_IOException() throws IOException {
        Path subdir = tempDir.resolve("rewards").resolve("mydir");
        Files.createDirectories(subdir);
        Files.writeString(subdir.resolve("child.txt"), "hello");

        // Should catch the IOException and return silently
        assertDoesNotThrow(() -> imageStorageService.delete("/uploads/rewards/mydir"));
    }
}
