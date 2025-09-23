// List & Create Member Categories
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  MemberCategoryCreateInput,
  MemberCategoryListResponse,
  MemberCategoryResponse,
  MemberCategoryErrorResponse,
} from "@/types/member-category";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const activeParam = searchParams.get("active");
  const active = activeParam === null ? undefined : activeParam === "true";

  const data = await prisma.memberCategory.findMany({
    where: {
      ...(active !== undefined ? { active } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ rank: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data } as MemberCategoryListResponse);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as MemberCategoryCreateInput;
    const { code, name, description, rank, active = true } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "code and name are required" } as MemberCategoryErrorResponse,
        { status: 400 }
      );
    }

    const data = await prisma.memberCategory.create({
      data: { code, name, description, rank, active },
    });

    return NextResponse.json({ data } as MemberCategoryResponse, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create member category";
    return NextResponse.json(
      { error: errorMessage } as MemberCategoryErrorResponse,
      { status: 500 }
    );
  }
}
