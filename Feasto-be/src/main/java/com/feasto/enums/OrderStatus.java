package com.feasto.enums;

public enum OrderStatus {
    // for user
    PLACED,
    CANCELLED,

    // for restaurant
    PREPARING,
    ACCEPTED,
    REJECTED,
    ASSIGNED,

    // for delivery partner
    OUT_FOR_DELIVERY,
    DELIVERED

}