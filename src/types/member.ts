export const MEMBER_STATUS = [
  "PROSPECT",
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
] as const;

export const CATEGORY = [
  "GOLD",
  "SILVER",
  "BRONZE",
  "VIP",
  "BEGINNER",
] as const;

export const GENDER = [
  "MALE",
  "FEMALE",
  "OTHER",
] as const;

export const MEMBERSHIP_LEVEL = [
  "ORDINARY",
  "EXECUTIVE",
  "DELEGATE",
  "OTHER",
] as const;

export const EDUCATION_LEVEL = [
  "PRIMARY",
  "SECONDARY",
  "TERTIARY",
  "POSTGRADUATE",
  "VOCATIONAL",
  "OTHER",
] as const;

export type MemberStatus = (typeof MEMBER_STATUS)[number];
export type MemberCategory = (typeof CATEGORY)[number];
export type Gender = (typeof GENDER)[number];
export type MembershipLevel = (typeof MEMBERSHIP_LEVEL)[number];
export type EducationLevel = (typeof EDUCATION_LEVEL)[number];
export type Member = {
  // Auto-generated fields
  id: string;
  membershipId?: string; // Auto-generated membership ID
  createdAt: string; // ISO - Date of Registration
  
  // Required personal information
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender: Gender;
  nationalId: string; // National ID / Voter ID Number
  phone: string; // Now required
  residentialAddress: string; // Now required
  regionConstituencyElectoralArea: string; // Required
  
  // Optional personal information
  email?: string; // Now optional
  occupation?: string;
  highestEducationLevel?: EducationLevel;
  
  // Membership details
  membershipLevel: MembershipLevel;
  branchWard?: string; // Branch / Ward (dropdown of local branches)
  recruitedBy?: string; // Optional: name or member ID of recruiter
  
  // System fields
  level: MemberCategory; // Keep for backward compatibility
  status: MemberStatus;
  outstandingBalance: number;
  
  // Attachments
  passportPictureUrl?: string | null;
  
  // Deprecated/legacy fields - keep for backward compatibility
  nationality?: string;
};
