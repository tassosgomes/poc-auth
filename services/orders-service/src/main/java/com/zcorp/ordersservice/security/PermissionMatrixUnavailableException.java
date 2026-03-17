package com.zcorp.ordersservice.security;

public class PermissionMatrixUnavailableException extends RuntimeException {

    public PermissionMatrixUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}