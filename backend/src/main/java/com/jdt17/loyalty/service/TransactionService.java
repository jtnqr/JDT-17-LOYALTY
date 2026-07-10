package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.transaction.EarnPointsRequest;
import com.jdt17.loyalty.dto.transaction.EarnPointsResponse;
import com.jdt17.loyalty.entity.Member;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.entity.PointBalance;
import com.jdt17.loyalty.entity.Transaction;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.MemberRepository;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.PointBalanceRepository;
import com.jdt17.loyalty.repository.TransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final MemberRepository memberRepository;
    private final PartnerRepository partnerRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final TransactionRepository transactionRepository;
    private final AuditTrailService auditTrailService;

    @Transactional
    public EarnPointsResponse earnPoints(EarnPointsRequest request) {
        // checking partner
        Partner partner = partnerRepository.findByCode(request.getPartner())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Partner does not exist", "PARTNER_NOT_FOUND"));

        if("INACTIVE".equalsIgnoreCase(partner.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Partner status is INACTIVE", "PARTNER_INACTIVE");
        }

        // login with partner account and id partner.
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentPartnerId = authentication.getName();
        boolean isPartner = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PARTNER"));

        if(!isPartner || !partner.getId().toString().equals(currentPartnerId)) {
            throw new LoyaltyException(HttpStatus.FORBIDDEN, "Access denied", "FORBIDDEN");
        }

        // check member from phone number / email
        Member member = memberRepository.findByPhone(request.getMemberIdentifier())
                .or(() -> memberRepository.findByEmail(request.getMemberIdentifier()))
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Member does not exist", "MEMBER_NOT_FOUND"));

        if("INACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Member status is INACTIVE", "MEMBER_INACTIVE");
        }

        // count point
        long pointsEarned = (request.getTrxAmount() / 1000 * partner.getPointPerThousandIdr());
        OffsetDateTime expiresAt = OffsetDateTime.now().plusDays(partner.getExpiryDays());

        // update point member
        PointBalance pointBalance = pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), partner.getId())
                .orElseGet(() -> PointBalance.builder()
                        .member(member)
                        .partner(partner)
                        .balance(0L)
                        .build()
                );

        pointBalance.setBalance(pointBalance.getBalance() + pointsEarned);
        PointBalance savedBalance = pointBalanceRepository.save(pointBalance);

        Transaction transaction = Transaction.builder()
                .member(member)
                .partner(partner)
                .type("EARN")
                .points(pointsEarned)
                .trxAmountIdr(request.getTrxAmount())
                .expiresAt(expiresAt)
                .build();
        Transaction savedTx = transactionRepository.save(transaction);

        // audit trail
        auditTrailService.logEvent("POINTS_EARNED", null, "SYSTEM", "TRANSACTION", savedTx.getId(), null);

        return EarnPointsResponse.builder()
                .transactionId(savedTx.getId())
                .memberId(member.getId())
                .partner(partner.getCode())
                .trxAmountIDR(request.getTrxAmount())
                .pointsEarned(pointsEarned)
                .newBalance(savedBalance.getBalance())
                .expiresAt(expiresAt)
                .createdAt(savedTx.getCreatedAt())
                .build();
    }
}
