package com.heymate.websocket;

import lombok.Data;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class TrackingController {

    @Data
    public static class LocationUpdate {
        private Long bookingId;
        private double lat;
        private double lng;
        private String providerName;
        private long timestamp;
    }

    // Provider sends location → broadcasts to user watching /topic/tracking/{bookingId}
    @MessageMapping("/location/{bookingId}")
    @SendTo("/topic/tracking/{bookingId}")
    public LocationUpdate broadcastLocation(
            @DestinationVariable Long bookingId,
            LocationUpdate update) {
        update.setBookingId(bookingId);
        update.setTimestamp(System.currentTimeMillis());
        return update;
    }
}
