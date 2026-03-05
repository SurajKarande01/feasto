// src/main/java/com/tka/feasto/exception/ResourceNotFoundException.java
package com.feasto.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}