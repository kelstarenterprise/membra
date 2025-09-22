// List & Create Member Categories
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, description, rank, active = true } = body;

  if (!code || !name) {
    return NextResponse.json(
      { error: "code and name are required" },
      { status: 400 }
    );
  }

  const data = await prisma.memberCategory.create({
    data: { code, name, description, rank, active },
  });

  return NextResponse.json({ data }, { status: 201 });
}
