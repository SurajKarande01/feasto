package com.feasto.service;

public class ImageUploadResult {
    private final String imageUrl;
    private final String publicId;

    public ImageUploadResult(String imageUrl, String publicId) {
        this.imageUrl = imageUrl;
        this.publicId = publicId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    // backwards-compatible accessor (old code used deleteUrl to store provider
    // id/url)
    public String getDeleteUrl() {
        return publicId;
    }

    public String getPublicId() {
        return publicId;
    }
}
