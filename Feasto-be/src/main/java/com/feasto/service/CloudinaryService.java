package com.feasto.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Formatter;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CloudinaryService {

    @Value("${cloudinary.cloud_name:}")
    private String cloudName;

    @Value("${cloudinary.api_key:}")
    private String apiKey;

    @Value("${cloudinary.api_secret:}")
    private String apiSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Upload image using signed parameters: api_key, timestamp, signature.
     * This avoids requiring an unsigned preset on the account.
     */
    public ImageUploadResult uploadImage(MultipartFile file, String publicIdPrefix) {
        if (file == null || file.isEmpty())
            return null;
        try {
            String url = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";

            if (apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
                throw new RuntimeException("Cloudinary credentials missing (cloudinary.api_key/cloudinary.api_secret)");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new org.springframework.core.io.ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });

            long timestamp = Instant.now().getEpochSecond();
            String publicId = null;
            if (publicIdPrefix != null && !publicIdPrefix.isBlank()) {
                publicId = publicIdPrefix + "-" + Instant.now().toEpochMilli();
                body.add("public_id", publicId);
            }

            // Build signature string (parameters must be sorted lexicographically by key).
            // For our small set: public_id (optional) then timestamp
            StringBuilder signBuilder = new StringBuilder();
            if (publicId != null) {
                signBuilder.append("public_id=").append(publicId).append("&");
            }
            signBuilder.append("timestamp=").append(timestamp);

            String signature = sha1Hex(signBuilder.toString() + apiSecret);

            body.add("api_key", apiKey);
            body.add("timestamp", String.valueOf(timestamp));
            body.add("signature", signature);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    url, HttpMethod.POST, request,
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            Map<String, Object> map = resp.getBody();
            if (resp.getStatusCode().is2xxSuccessful() && map != null) {
                Object secureUrl = map.get("secure_url");
                Object pub = map.get("public_id");
                String imageUrl = secureUrl == null ? null : secureUrl.toString();
                String pubId = pub == null ? publicId : pub.toString();
                return new ImageUploadResult(imageUrl, pubId == null ? null : pubId);
            }
            return null;
        } catch (Exception ex) {
            throw new RuntimeException("Cloudinary upload failed: " + ex.getMessage(), ex);
        }
    }

    // Delete by public_id using signed params
    public boolean deleteImage(String publicId) {
        if (publicId == null || publicId.isBlank())
            return false;
        try {
            if (apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
                return false;
            }
            String url = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/destroy";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            long timestamp = Instant.now().getEpochSecond();
            StringBuilder signBuilder = new StringBuilder();
            signBuilder.append("public_id=").append(publicId).append("&timestamp=").append(timestamp);
            String signature = sha1Hex(signBuilder.toString() + apiSecret);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("public_id", publicId);
            body.add("api_key", apiKey);
            body.add("timestamp", String.valueOf(timestamp));
            body.add("signature", signature);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    url, HttpMethod.POST, request,
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            Map<String, Object> map = resp.getBody();
            if (resp.getStatusCode().is2xxSuccessful() && map != null) {
                Object result = map.get("result");
                if (result != null && result.toString().equalsIgnoreCase("ok")) {
                    return true;
                }
            }
            return false;
        } catch (Exception ex) {
            return false;
        }
    }

    private String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] bytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            Formatter formatter = new Formatter();
            for (byte b : bytes) {
                formatter.format("%02x", b);
            }
            String res = formatter.toString();
            formatter.close();
            return res;
        } catch (Exception ex) {
            throw new RuntimeException("Failed to compute SHA-1: " + ex.getMessage(), ex);
        }
    }
}
