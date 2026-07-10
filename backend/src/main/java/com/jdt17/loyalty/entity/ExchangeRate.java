package com.jdt17.loyalty.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "mst_exchange_rate", uniqueConstraints = {
    @UniqueConstraint(name = "uq_exchange_rate", columnNames = {"from_partner_id", "to_partner_id", "effective_from"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRate {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_partner_id", nullable = false)
    private Partner fromPartner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_partner_id", nullable = false)
    private Partner toPartner;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal rate;

    @Column(name = "effective_from", nullable = false)
    private OffsetDateTime effectiveFrom;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (effectiveFrom == null) {
            effectiveFrom = OffsetDateTime.now();
        }
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
