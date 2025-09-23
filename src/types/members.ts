// TypeScript types for Members API

import type {
  Member,
  MemberCategory,
  Gender,
  MemberStatus,
  MembershipLevel,
  EducationLevel,
} from "@prisma/client";

export interface MemberWithCategory extends Member {
  memberCategory?: MemberCategory | null;
}

export interface MembersListResponse {
  data: MemberWithCategory[];
  paging: {
    page: number;
    size: number;
    total: number;
    pages: number;
  };
}

export interface MemberResponse {
  data: MemberWithCategory;
}

export interface MemberCreateInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  nationalId: string;
  phone: string;
  residentialAddress: string;
  regionConstituencyElectoralArea: string;
  membershipLevel: MembershipLevel;
  email?: string | null;
  occupation?: string | null;
  highestEducationLevel?: EducationLevel | null;
  branchWard?: string | null;
  recruitedBy?: string | null;
  nationality?: string | null;
  status?: MemberStatus;
  memberCategoryId?: string | null;
  memberCategoryCode?: string | null;
  level?: string | null;
  passportPictureUrl?: string | null;
}

export interface MemberProfile {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  member?: {
    id: string;
    membershipId?: string | null;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone: string;
    membershipLevel: MembershipLevel;
    status: MemberStatus;
    memberCategory?: {
      code: string;
      name: string;
    } | null;
  } | null;
}

export interface MemberProfileResponse {
  data: MemberProfile;
}

export interface ApiErrorResponse {
  error: string;
  meta?: unknown;
}