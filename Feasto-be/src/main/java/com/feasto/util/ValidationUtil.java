package com.feasto.util;

import org.springframework.web.multipart.MultipartFile;

import com.feasto.exception.ValidationException;

public class ValidationUtil {

	


    public static boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    }

    public static boolean isValidPhone(String phone) {
        return phone != null && phone.matches("^[0-9]{10,15}$");
    }

    public static boolean isNullOrEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    // Validate uploaded image: allowed types jpg/jpeg/png and max size mb
    public static void validateImage(MultipartFile image, double maxFileSizeMB) {
        if (image == null || image.isEmpty())
            return;

        String ct = image.getContentType();
        if (ct == null) {
            throw new ValidationException("Image content type missing");
        }

        String lower = ct.toLowerCase();
        if (!(lower.contains("jpeg") || lower.contains("jpg") || lower.contains("png"))) {
            throw new ValidationException("Only JPG/JPEG/PNG images are allowed");
        }

        // ✅ Convert MB → bytes
        long maxBytes = (long) (maxFileSizeMB * 1024 * 1024);

        if (image.getSize() > maxBytes) {
            throw new ValidationException("Image must be at most " + maxFileSizeMB + " MB in size");
        }
    }

}
