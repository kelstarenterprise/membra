// src/app/api/members/route.ts
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  Prisma,
  Gender,
  MembershipLevel,
  EducationLevel,
  MemberStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/auth";
import { generateMembershipId } from "@/lib/id";
import { sendMemberWelcomeEmail } from "@/lib/mailer";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import type { SessionUser } from "@/types/auth";
import type {
  MembersListResponse,
  MemberResponse,
  ApiErrorResponse,
} from "@/types/members";

/** RBAC */
async function requireAdmin() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const role = sessionUser?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

/** Helpers for Zod enum coercion */
const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);
const toUpper = (v: unknown) => (typeof v === "string" ? v.toUpperCase() : v);
const upperEnum = <T extends Record<string, string>>(e: T) =>
  z.preprocess(toUpper, z.nativeEnum(e));

/** Validation (API) */
const MemberCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),

  dateOfBirth: z
    .string()
    .min(1)
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),

  // Use Prisma enums, case-insensitive
  gender: upperEnum(Gender),
  membershipLevel: upperEnum(MembershipLevel),

  nationalId: z.string().min(1),
  phone: z.string().min(1),
  residentialAddress: z.string().min(1),
  regionConstituencyElectoralArea: z.string().min(1),

  // optional — normalize "" -> null
  email: z
    .preprocess(emptyToUndef, z.string().email().optional())
    .nullable()
    .transform((v) => v ?? null),

  occupation: z
    .preprocess(emptyToUndef, z.string().optional())
    .nullable()
    .transform((v) => v ?? null),

  highestEducationLevel: z
    .preprocess(emptyToUndef, upperEnum(EducationLevel).optional())
    .nullable()
    .transform((v) => v ?? null),

  branchWard: z
    .preprocess(emptyToUndef, z.string().optional())
    .nullable()
    .transform((v) => v ?? null),

  recruitedBy: z
    .preprocess(emptyToUndef, z.string().optional())
    .nullable()
    .transform((v) => v ?? null),

  nationality: z
    .preprocess(emptyToUndef, z.string().optional())
    .nullable()
    .transform((v) => v ?? null),

  // status: allow blank -> default to PROSPECT
  status: z
    .preprocess(emptyToUndef, upperEnum(MemberStatus).optional())
    .default(MemberStatus.PROSPECT),

  // level via id OR code/level (accept "" as undefined)
  memberCategoryId: z
    .preprocess(emptyToUndef, z.string().optional())
    .nullable()
    .transform((v) => v ?? null),

  memberCategoryCode: z
    .preprocess(emptyToUndef, z.string().optional())
    .nullable()
    .transform((v) => v ?? null),

  level: z
    .preprocess(emptyToUndef, z.string().optional())
    .nullable()
    .transform((v) => v ?? null),

  // ignore file uploads and other fields
  passportPicture: z.unknown().optional(), // File or FileList from form
  passportPictureUrl: z
    .preprocess(emptyToUndef, z.string().url().optional())
    .nullable()
    .transform((v) => v ?? null),

  // client-sent balance is ignored
  outstandingBalance: z.unknown().optional(),
});

export async function GET(req: Request) {
  // Admin-only listing
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const category = (searchParams.get("category") || "").trim(); // code or id
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const size = Math.min(
      100,
      Math.max(1, Number(searchParams.get("size") || "20"))
    );
    const skip = (page - 1) * size;

    // Resolve category
    let memberCategoryIdFilter: string | undefined;
    if (category) {
      const byId = await prisma.memberCategory.findUnique({
        where: { id: category },
      });
      if (byId) {
        memberCategoryIdFilter = byId.id;
      } else {
        const byCode = await prisma.memberCategory.findUnique({
          where: { code: category.toUpperCase() },
        });
        if (byCode) memberCategoryIdFilter = byCode.id;

        if (!byId && !byCode) {
          return NextResponse.json({
            data: [],
            paging: { page, size, total: 0, pages: 0 },
          });
        }
      }
    }

    const where: Prisma.MemberWhereInput = {
      AND: [
        memberCategoryIdFilter
          ? { memberCategoryId: memberCategoryIdFilter }
          : {},
        status ? { status: status as MemberStatus } : {},
        q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { nationalId: { contains: q, mode: "insensitive" } },
                { membershipId: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const [total, rows] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        include: { memberCategory: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: size,
      }),
    ]);

    return NextResponse.json({
      data: rows,
      paging: { page, size, total, pages: Math.ceil(total / size) },
    } as MembersListResponse);
  } catch (error) {
    console.error("Error fetching members:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch members";
    return NextResponse.json(
      { error: errorMessage } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Admin-only create
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    const json = await req.json();
    const parsed = MemberCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          meta: parsed.error.format(),
        } as ApiErrorResponse,
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Resolve MemberCategory
    let memberCategoryId = body.memberCategoryId ?? undefined;
    if (!memberCategoryId) {
      const code = (body.memberCategoryCode || body.level || "") as string;
      if (!code) {
        return NextResponse.json(
          {
            error:
              "Provide memberCategoryId or memberCategoryCode/level (e.g., GOLD).",
          } as ApiErrorResponse,
          { status: 400 }
        );
      }
      const upperCode = code.toUpperCase();
      const cat = await prisma.memberCategory.findUnique({
        where: { code: upperCode },
      });
      if (!cat) {
        return NextResponse.json(
          { error: `Unknown category code: ${upperCode}` } as ApiErrorResponse,
          { status: 400 }
        );
      }
      memberCategoryId = cat.id;
    } else {
      const exists = await prisma.memberCategory.findUnique({
        where: { id: memberCategoryId },
      });
      if (!exists) {
        return NextResponse.json(
          { error: `memberCategoryId not found: ${memberCategoryId}` } as ApiErrorResponse,
          { status: 400 }
        );
      }
    }

    // Generate unique 9-char membershipId (retry on rare collision)
    let membershipId = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateMembershipId(9);
      const conflict = await prisma.member.findUnique({
        where: { membershipId: candidate },
      });
      if (!conflict) {
        membershipId = candidate;
        break;
      }
    }
    if (!membershipId) {
      return NextResponse.json(
        { error: "Could not generate unique membershipId" } as ApiErrorResponse,
        { status: 500 }
      );
    }

    // Create member (do not accept client-sent balance)
    const created = await prisma.member.create({
      data: {
        membershipId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email ?? null,
        phone: body.phone,
        gender: body.gender, // Gender enum
        dateOfBirth: new Date(body.dateOfBirth),
        nationalId: body.nationalId,
        residentialAddress: body.residentialAddress,
        regionConstituencyElectoralArea: body.regionConstituencyElectoralArea,
        occupation: body.occupation ?? null,
        highestEducationLevel: body.highestEducationLevel, // EducationLevel | null
        membershipLevel: body.membershipLevel, // MembershipLevel enum
        branchWard: body.branchWard ?? null,
        recruitedBy: body.recruitedBy ?? null,
        status: body.status, // MemberStatus enum
        outstandingBalance: new Prisma.Decimal(0),
        passportPictureUrl: body.passportPictureUrl ?? null,
        nationality: body.nationality ?? null,
        memberCategoryId,
      },
      include: { memberCategory: true },
    });

    // Send email (non-blocking)
    sendMemberWelcomeEmail({
      to: created.email,
      firstName: created.firstName,
      membershipId,
    }).catch(console.error);

    return NextResponse.json({ data: created } as MemberResponse, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating member:", error);

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Unique field conflict (email, phone, nationalId, or membershipId).",
          meta: error.meta,
        } as ApiErrorResponse,
        { status: 409 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to create member";
    return NextResponse.json(
      { error: errorMessage } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
