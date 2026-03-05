// src/main/java/com/tka/feasto/exception/ValidationException.java
package com.feasto.exception;

public class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}