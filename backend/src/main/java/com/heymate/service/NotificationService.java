package com.heymate.service;

import com.google.firebase.messaging.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationService {

    public void sendPush(String fcmToken, String title, String body) {
        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putData("title", title)
                    .putData("body", body)
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("FCM sent: {}", response);
        } catch (FirebaseMessagingException e) {
            log.error("FCM error: {}", e.getMessage());
        }
    }

    public void sendDataMessage(String fcmToken, java.util.Map<String, String> data) {
        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .putAllData(data)
                    .build();
            FirebaseMessaging.getInstance().send(message);
        } catch (FirebaseMessagingException e) {
            log.error("FCM data message error: {}", e.getMessage());
        }
    }
}
