// src/app/api/members/route.ts
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"; // add this

/** Helpers */
function isValidDate(d: unknown): d is string {
  if (typeof d !== "string") return false;
  const n = Date.parse(d);
  return !Number.isNaN(n);
}
const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "nationalId",
  "phone",
  "residentialAddress",
  "regionConstituencyElectoralArea",
  "membershipLevel",
] as const;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const status = (searchParams.get("status") || "").trim(); // e.g. ACTIVE | PENDING | ...
    const category = (searchParams.get("category") || "").trim(); // code (e.g. GOLD) or id
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const size = Math.min(
      100,
      Math.max(1, Number(searchParams.get("size") || "20"))
    );
    const skip = (page - 1) * size;

    // Resolve category filter if provided (accept code or id)
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
        // if not found, treat as no match (empty results)
        if (!byId && !byCode) {
          return NextResponse.json({
            data: [],
            paging: { page, size, total: 0 },
          });
        }
      }
    }

    const where: Prisma.MemberWhereInput = {
      AND: [
        memberCategoryIdFilter
          ? { memberCategoryId: memberCategoryIdFilter }
          : {},
        status
          ? {
              status: status as "PROSPECT" | "PENDING" | "ACTIVE" | "SUSPENDED",
            }
          : {},
        q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { nationalId: { contains: q, mode: "insensitive" } },
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
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    // 1) Normal required fields (keep type-safe by widening to string[])
    const missingRequired: string[] = (
      REQUIRED_FIELDS as readonly string[]
    ).filter((k) => !body[k as keyof typeof body]);

    // 2) Level (MemberCategory) can come from any of these keys
    const hasLevel =
      !!body["memberCategoryId"] ||
      !!body["memberCategoryCode"] ||
      !!body["level"];

    const missingLevel = hasLevel
      ? []
      : ["memberCategoryId", "memberCategoryCode", "level"];

    const missing = [...missingRequired, ...missingLevel];

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // 3) Validate date
    if (!isValidDate(body.dateOfBirth)) {
      return NextResponse.json(
        {
          error:
            "Invalid dateOfBirth. Use an ISO date string (e.g., 1990-01-01).",
        },
        { status: 400 }
      );
    }

    // 4) Resolve MemberCategory (id → ok; else code/level)
    let memberCategoryId = body.memberCategoryId as string | undefined;

    if (!memberCategoryId) {
      const codeCandidate =
        (body.memberCategoryCode as string | undefined) ??
        (body.level as string | undefined);

      const cat = codeCandidate
        ? await prisma.memberCategory.findUnique({
            where: { code: codeCandidate.toUpperCase() },
          })
        : null;

      if (!cat) {
        return NextResponse.json(
          {
            error:
              "A valid level is required. Provide memberCategoryId or memberCategoryCode (e.g., GOLD).",
          },
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
          { error: `memberCategoryId not found: ${memberCategoryId}` },
          { status: 400 }
        );
      }
    }

    // 5) Create member
    const created = await prisma.member.create({
      data: {
        firstName: body.firstName as string,
        lastName: body.lastName as string,
        email: (body.email as string | null) ?? null,
        phone: body.phone as string,
        gender: body.gender as "MALE" | "FEMALE" | "OTHER",
        dateOfBirth: new Date(body.dateOfBirth as string),
        nationalId: body.nationalId as string,
        residentialAddress: body.residentialAddress as string,
        regionConstituencyElectoralArea:
          body.regionConstituencyElectoralArea as string,

        membershipLevel: body.membershipLevel as
          | "ORDINARY"
          | "EXECUTIVE"
          | "DELEGATE"
          | "OTHER",
        branchWard: (body.branchWard as string | null) ?? null,
        recruitedBy: (body.recruitedBy as string | null) ?? null,

        status: ((body.status as string) ?? "PROSPECT") as
          | "PROSPECT"
          | "PENDING"
          | "ACTIVE"
          | "SUSPENDED",
        outstandingBalance: (body.outstandingBalance as number) ?? 0,

        passportPictureUrl: (body.passportPictureUrl as string | null) ?? null,
        nationality: (body.nationality as string | null) ?? null,

        memberCategoryId,
      },
      include: { memberCategory: true },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating member:", error);

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A member with a unique field already exists (email, phone, or national ID).",
          meta: error.meta,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
