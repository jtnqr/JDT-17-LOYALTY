import {
  Member,
  Partner,
  PointBalance,
  Transaction,
  MemberActivity,
  PartnerActivity,
} from "@/types";

export type {
  Member,
  Partner,
  PointBalance,
  Transaction,
  MemberActivity,
  PartnerActivity,
};



export const DASHBOARD_MOCK_BALANCES: PointBalance[] = [
  { partnerId: "kfc-uuid", partnerName: "KFC Colonel's Club", balance: 1200 },
  { partnerId: "mcd-uuid", partnerName: "McDonald's MyRewards", balance: 4850 },
];

export const PROFILE_MOCK_BALANCES: PointBalance[] = [
  { partnerId: "kfc-uuid", partnerName: "KFC Colonel's Club", balance: 12450 },
  { partnerId: "mcd-uuid", partnerName: "McDonald's MyRewards", balance: 4850 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-uuid-001",
    type: "EXCHANGE_OUT",
    partnerName: "McDonald's Purchase",
    points: 450,
    timeText: "2 hours ago",
    createdAt: "2026-07-07T08:00:00Z",
  },
  {
    id: "tx-uuid-002",
    type: "REDEEM",
    partnerName: "Free Coffee Reward",
    points: -200,
    timeText: "Yesterday",
    createdAt: "2026-07-06T10:00:00Z",
  },
];

export const MOCK_MEMBERS: Member[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Budi Santoso",
    email: "budi.santoso@example.com",
    phone: "081234567890",
    status: "ACTIVE",
    createdAt: "2026-07-02T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "081298765432",
    status: "ACTIVE",
    createdAt: "2026-07-03T11:15:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "085612345678",
    status: "INACTIVE",
    createdAt: "2026-07-04T09:30:00Z",
  },
];

export const MOCK_PARTNERS: Partner[] = [
  {
    id: "kfc-uuid",
    name: "KFC",
    code: "KFC",
    pointsPerThousandIDR: 1,
    expiryDays: 365,
    status: "ACTIVE",
  },
  {
    id: "mcd-uuid",
    name: "McDonald's",
    code: "MCD",
    pointsPerThousandIDR: 1,
    expiryDays: 365,
    status: "ACTIVE",
  },
];

export const MOCK_MEMBER_ACTIVITIES: MemberActivity[] = [
  {
    id: "act-m1",
    memberName: "Budi Santoso",
    memberEmail: "budi.santoso@example.com",
    activityType: "MEMBER_REGISTERED",
    details: "Platform registered member profile automatically",
    timestamp: "2026-07-02T10:00:00Z",
    status: "SUCCESS",
  },
  {
    id: "act-m2",
    memberName: "Budi Santoso",
    memberEmail: "budi.santoso@example.com",
    activityType: "POINTS_REDEEMED",
    details: "Redeemed reward item (KFC Crispy Chicken Voucher)",
    timestamp: "2026-07-03T14:30:15Z",
    status: "SUCCESS",
  },
  {
    id: "act-m3",
    memberName: "Jane Doe",
    memberEmail: "jane.doe@example.com",
    activityType: "POINTS_EXCHANGED",
    details: "Initiated points transfer from McDonald's to KFC balance",
    timestamp: "2026-07-04T16:15:22Z",
    status: "SUCCESS",
  },
  {
    id: "act-m4",
    memberName: "Budi Santoso",
    memberEmail: "budi.santoso@example.com",
    activityType: "MEMBER_STATUS_CHANGED",
    details: "Profile status changed to ACTIVE by Super Administrator",
    timestamp: "2026-07-05T09:00:00Z",
    status: "SUCCESS",
  },
];

export const MOCK_PARTNER_ACTIVITIES: PartnerActivity[] = [
  {
    id: "act-p1",
    partnerCode: "KFC",
    partnerName: "KFC Indonesia",
    activityType: "PARTNER_CREATED",
    details: "New partner merchant initialized and bulk-seeded members",
    timestamp: "2026-07-01T08:00:00Z",
    status: "SUCCESS",
  },
  {
    id: "act-p2",
    partnerCode: "KFC",
    partnerName: "KFC Indonesia",
    activityType: "POINTS_EARNED",
    details: "Injected points accumulation for member (Budi Santoso)",
    timestamp: "2026-07-02T11:20:10Z",
    status: "SUCCESS",
  },
  {
    id: "act-p3",
    partnerCode: "MCD",
    partnerName: "McDonald's",
    activityType: "POINTS_EARNED",
    details: "Injected points accumulation for member (Jane Doe)",
    timestamp: "2026-07-03T15:40:45Z",
    status: "SUCCESS",
  },
  {
    id: "act-p4",
    partnerCode: "KFC",
    partnerName: "KFC Indonesia",
    activityType: "PARTNER_STATUS_CHANGE",
    details: "Merchant operational status updated to ACTIVE",
    timestamp: "2026-07-04T10:00:00Z",
    status: "SUCCESS",
  },
];
