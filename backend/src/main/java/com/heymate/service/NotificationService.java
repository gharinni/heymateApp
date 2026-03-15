package com.heymate.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
@Slf4j
public class NotificationService {

    public void sendPush(String fcmToken, String title, String body) {
        // Firebase not configured — log only
        log.info("Notification: {} - {}", title, body);
    }

    public void sendDataMessage(String fcmToken, Map<String, String> data) {
        log.info("Data message: {}", data);
    }
}
