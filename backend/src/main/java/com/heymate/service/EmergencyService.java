package com.heymate.service;

import com.heymate.entity.BloodDonor;
import com.heymate.entity.TrustedContact;
import com.heymate.repository.BloodDonorRepository;
import com.heymate.repository.TrustedContactRepository;
import com.heymate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmergencyService {

    private final TrustedContactRepository trustedContactRepository;
    private final BloodDonorRepository bloodDonorRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Async
    public void triggerSOS(String phone, double lat, double lng) {
        userRepository.findByPhone(phone).ifPresent(user -> {
            List<TrustedContact> contacts = trustedContactRepository.findByUserId(user.getId());

            for (TrustedContact contact : contacts) {
                String message = "🚨 SOS from " + user.getName() +
                    "! Location: https://maps.google.com/?q=" + lat + "," + lng +
                    " — Please help or call 112.";

                // SMS (Twilio integration placeholder)
                log.info("Sending SOS SMS to {} : {}", contact.getPhone(), message);
                // smsService.send(contact.getPhone(), message);

                // FCM if contact is an app user
                userRepository.findByPhone(contact.getPhone()).ifPresent(contactUser -> {
                    if (contactUser.getFcmToken() != null) {
                        notificationService.sendPush(contactUser.getFcmToken(),
                            "🚨 SOS Alert - " + user.getName(), message);
                    }
                });
            }
        });
    }

    public List<BloodDonor> findBloodDonors(double lat, double lng,
                                             String bloodType, double radiusKm) {
        return bloodDonorRepository.findNearbyDonors(lat, lng, bloodType, radiusKm * 1000);
    }

    @Transactional
    public TrustedContact addTrustedContact(String phone, TrustedContact contact) {
        var user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        contact.setUser(user);
        return trustedContactRepository.save(contact);
    }

    public List<TrustedContact> getTrustedContacts(String phone) {
        var user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return trustedContactRepository.findByUserId(user.getId());
    }

    @Transactional
    public void removeTrustedContact(String phone, Long contactId) {
        var user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        trustedContactRepository.deleteByUserIdAndId(user.getId(), contactId);
    }
}
