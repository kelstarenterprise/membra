// src/lib/members.ts
import { db } from "./db";
import { Member as PrismaMember } from "@prisma/client";
import {
  Member,
  // keep your existing frontend types (level as string code)
  MemberCategory as MemberCategoryCode,
  MemberStatus,
  Gender,
  MembershipLevel,
  EducationLevel,
} from "@/types/member";

/** ===== Create/Update DTOs (add id/code for category) ===== */
export type CreateMemberInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO
  gender: Gender;
  nationalId: string;
  phone: string;
  residentialAddress: string;
  regionConstituencyElectoralArea: string;

  email?: string;
  occupation?: string;
  highestEducationLevel?: EducationLevel;

  membershipLevel: MembershipLevel;
  branchWard?: string;
  recruitedBy?: string;

  // Level: accept any of these (id preferred), or fall back to default BEGINNER
  memberCategoryId?: string;
  memberCategoryCode?: string; // e.g. "GOLD"
  level?: MemberCategoryCode; // legacy

  status?: MemberStatus;

  nationality?: string;
  passportPictureUrl?: string;
  outstandingBalance?: number;
};

export type UpdateMemberInput = Partial<CreateMemberInput>;

/** ===== Helpers ===== */
function toISODateOnly(d: Date): string {
  return d.toISOString().split("T")[0];
}

async function resolveMemberCategoryId(
  input: {
    memberCategoryId?: string;
    memberCategoryCode?: string;
    level?: string;
  },
  fallbackCode = "BEGINNER"
): Promise<string> {
  // 1) explicit id
  if (input.memberCategoryId) {
    const cat = await db.memberCategory.findUnique({
      where: { id: input.memberCategoryId },
    });
    if (cat) return cat.id;
    throw new Error(`memberCategoryId not found: ${input.memberCategoryId}`);
  }
  // 2) explicit code
  const code = (
    input.memberCategoryCode ??
    input.level ??
    fallbackCode
  ).toUpperCase();
  const byCode = await db.memberCategory.findUnique({ where: { code } });
  if (byCode) return byCode.id;

  // last chance: try fallback
  if (code !== fallbackCode) {
    const fb = await db.memberCategory.findUnique({
      where: { code: fallbackCode },
    });
    if (fb) return fb.id;
  }
  throw new Error(
    `MemberCategory code not found: ${code}. Ensure default category '${fallbackCode}' exists.`
  );
}

/** Map Prisma -> frontend Member (maps relation code to .level) */
export function prismaToMember(
  prismaMember: PrismaMember & { memberCategory?: { code: string } | null }
): Member {
  return {
    id: prismaMember.id,
    membershipId: prismaMember.membershipId ?? undefined,
    createdAt: prismaMember.createdAt.toISOString(),

    firstName: prismaMember.firstName,
    lastName: prismaMember.lastName,
    dateOfBirth: toISODateOnly(prismaMember.dateOfBirth),
    gender: prismaMember.gender as Gender,
    nationalId: prismaMember.nationalId,
    phone: prismaMember.phone,
    residentialAddress: prismaMember.residentialAddress,
    regionConstituencyElectoralArea:
      prismaMember.regionConstituencyElectoralArea,

    email: prismaMember.email ?? undefined,
    occupation: prismaMember.occupation ?? undefined,
    highestEducationLevel: prismaMember.highestEducationLevel ?? undefined,

    membershipLevel: prismaMember.membershipLevel as MembershipLevel,
    branchWard: prismaMember.branchWard ?? undefined,
    recruitedBy: prismaMember.recruitedBy ?? undefined,

    // map relation -> frontend string code
    level: (prismaMember.memberCategory?.code ??
      "BEGINNER") as MemberCategoryCode,
    status: prismaMember.status as MemberStatus,
    outstandingBalance: Number(prismaMember.outstandingBalance),

    passportPictureUrl: prismaMember.passportPictureUrl ?? undefined,
    nationality: prismaMember.nationality ?? undefined,
  };
}

/** ===== Service ===== */
export class MemberService {
  static async getAllMembers(searchQuery?: string): Promise<Member[]> {
    const where = searchQuery
      ? {
          OR: [
            {
              firstName: {
                contains: searchQuery,
                mode: "insensitive" as const,
              },
            },
            {
              lastName: { contains: searchQuery, mode: "insensitive" as const },
            },
            { email: { contains: searchQuery, mode: "insensitive" as const } },
            {
              nationalId: {
                contains: searchQuery,
                mode: "insensitive" as const,
              },
            },
            { phone: { contains: searchQuery, mode: "insensitive" as const } },
          ],
        }
      : {};

    const rows = await db.member.findMany({
      where,
      include: { memberCategory: { select: { code: true } } },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(prismaToMember);
  }

  static async getMemberById(id: string): Promise<Member | null> {
    const row = await db.member.findUnique({
      where: { id },
      include: { memberCategory: { select: { code: true } } },
    });
    return row ? prismaToMember(row) : null;
  }

  static async createMember(input: CreateMemberInput): Promise<Member> {
    const membershipId = `MEM${Date.now().toString().slice(-8)}`;
    const memberCategoryId = await resolveMemberCategoryId(input);

    const created = await db.member.create({
      data: {
        membershipId,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: new Date(input.dateOfBirth),
        gender: input.gender,
        nationalId: input.nationalId,
        phone: input.phone,
        residentialAddress: input.residentialAddress,
        regionConstituencyElectoralArea: input.regionConstituencyElectoralArea,

        email: input.email ?? null,
        occupation: input.occupation ?? null,
        highestEducationLevel: input.highestEducationLevel ?? null,

        membershipLevel: input.membershipLevel,
        branchWard: input.branchWard ?? null,
        recruitedBy: input.recruitedBy ?? null,

        status: input.status ?? ("PROSPECT" as MemberStatus),
        outstandingBalance: input.outstandingBalance ?? 0,

        passportPictureUrl: input.passportPictureUrl ?? null,
        nationality: input.nationality ?? null,

        memberCategoryId, // <-- the relation
      },
      include: { memberCategory: { select: { code: true } } },
    });

    return prismaToMember(created);
  }

  static async updateMember(
    id: string,
    input: UpdateMemberInput
  ): Promise<Member | null> {
    try {
      const data: Record<string, unknown> = {};

      // date
      if (input.dateOfBirth) data.dateOfBirth = new Date(input.dateOfBirth);

      // scalar fields (skip undefined)
      const scalars: (keyof UpdateMemberInput)[] = [
        "firstName",
        "lastName",
        "gender",
        "nationalId",
        "phone",
        "residentialAddress",
        "regionConstituencyElectoralArea",
        "email",
        "occupation",
        "highestEducationLevel",
        "membershipLevel",
        "branchWard",
        "recruitedBy",
        "status",
        "passportPictureUrl",
        "nationality",
        "outstandingBalance",
      ];
      for (const k of scalars) {
        if (input[k] !== undefined) data[k] = input[k];
      }

      // level changes: accept id/code/legacy level
      if (
        input.memberCategoryId !== undefined ||
        input.memberCategoryCode !== undefined ||
        input.level !== undefined
      ) {
        data.memberCategoryId = await resolveMemberCategoryId({
          memberCategoryId: input.memberCategoryId,
          memberCategoryCode: input.memberCategoryCode,
          level: input.level,
        });
      }

      const updated = await db.member.update({
        where: { id },
        data,
        include: { memberCategory: { select: { code: true } } },
      });
      return prismaToMember(updated);
    } catch (e) {
      console.error("Error updating member:", e);
      return null;
    }
  }

  static async deleteMember(id: string): Promise<boolean> {
    try {
      await db.member.delete({ where: { id } });
      return true;
    } catch (e) {
      console.error("Error deleting member:", e);
      return false;
    }
  }
}
