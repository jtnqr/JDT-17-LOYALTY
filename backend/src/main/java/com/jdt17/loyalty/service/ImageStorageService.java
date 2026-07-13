package com.jdt17.loyalty.service;

import com.jdt17.loyalty.exception.LoyaltyException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    @Value("${app.uploads.dir:/app/uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    public String store(MultipartFile file, String subfolder) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, WEBP allowed", "INVALID_FILE_TYPE");
        }
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "File exceeds 2MB limit", "FILE_TOO_LARGE");
        }

        String ext = contentType.split("/")[1].replace("jpeg", "jpg");
        String filename = UUID.randomUUID() + "." + ext;
        Path target = Paths.get(uploadDir, subfolder, filename);
        
        Files.createDirectories(target.getParent());
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/" + subfolder + "/" + filename;
    }

    public void delete(String relativePath) {
        if (relativePath == null || !relativePath.startsWith("/uploads/")) {
            return;
        }
        try {
            String pathPart = relativePath.replaceFirst("^/uploads/", "");
            Path fileToDelete = Paths.get(uploadDir, pathPart);
            Files.deleteIfExists(fileToDelete);
        } catch (IOException ignored) {
        }
    }
}
