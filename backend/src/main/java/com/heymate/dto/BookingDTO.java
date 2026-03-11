package com.heymate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BookingDTO {

    @Data
    public static class CreateRequest {
        @NotNull  private Long providerId;
        @NotBlank private String serviceType;
        @NotBlank private String address;
        private String notes;
        private BigDecimal price;
        private LocalDateTime scheduledAt;
    }

    @Data
    public static class QuoteRequest {
        @NotNull private Long bookingId;
        @NotNull private BigDecimal price;
    }

    @Data
    public static class Response {
        private Long id;
        private Long userId;
        private String userName;
        private Long providerId;
        private String providerName;
        private String serviceType;
        private String status;
        private String address;
        private String notes;
        private BigDecimal price;
        private LocalDateTime scheduledAt;
        private LocalDateTime createdAt;
    }
}
