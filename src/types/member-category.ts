// TypeScript types for Member Categories

export interface MemberCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  rank?: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberCategoryCreateInput {
  code: string;
  name: string;
  description?: string | null;
  rank?: number | null;
  active?: boolean;
}

export interface MemberCategoryUpdateInput {
  code?: string;
  name?: string;
  description?: string | null;
  rank?: number | null;
  active?: boolean;
}

export interface MemberCategoryListResponse {
  data: MemberCategory[];
}

export interface MemberCategoryResponse {
  data: MemberCategory;
}

export interface MemberCategoryErrorResponse {
  error: string;
}