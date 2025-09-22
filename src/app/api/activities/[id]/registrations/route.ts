// List & Create Registrations for a specific Activity
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActivityStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id: activityId } = await ctx.params;
  const data = await prisma.activityRegistration.findMany({
    where: { activityId },
    include: { member: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: activityId } = await ctx.params;
  const body = await req.json();
  const { memberId, status = ActivityStatus.INVITED, notes } = body;

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 }
    );
  }

  const data = await prisma.activityRegistration.create({
    data: { activityId, memberId, status, notes: notes || null },
  });

  return NextResponse.json({ data }, { status: 201 });
}
