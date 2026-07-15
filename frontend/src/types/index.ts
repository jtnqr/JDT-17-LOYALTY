export interface MemberUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status?: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  code: string;
  pointsPerThousandIDR: number;
  expiryDays: number;
  status: string;
}

export interface PointBalance {
  partnerId: string;
  partnerName: string;
  balance: number;
}

export interface Transaction {
  id: string;
  type: string;
  partnerName: string;
  points: number;
  timeText?: string;
  trxAmountIDR?: number;
  createdAt: string;
  detailText?: string;
}

export interface MemberActivity {
  id: string;
  memberName: string;
  memberEmail: string;
  activityType: "MEMBER_REGISTERED" | "POINTS_REDEEMED" | "POINTS_EXCHANGED" | "MEMBER_STATUS_CHANGED";
  details: string;
  timestamp: string;
  status: "SUCCESS" | "FAILURE";
}

export interface PartnerActivity {
  id: string;
  partnerCode: string;
  partnerName: string;
  activityType: "PARTNER_CREATED" | "POINTS_EARNED" | "PARTNER_STATUS_CHANGE";
  details: string;
  timestamp: string;
  status: "SUCCESS" | "FAILURE";
}

export interface Reward {
  id: string;
  name: string;
  pointCost: number;
  status: "ACTIVE" | "INACTIVE";
  imageUrl: string;
  partnerCode: string;
  partnerId: string;
  partnerName: string;
}
