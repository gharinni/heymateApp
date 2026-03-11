package com.heymate.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trusted_contacts")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TrustedContact {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "user_id")
    private User user;

    private String name;
    private String phone;
    private String email;
}
