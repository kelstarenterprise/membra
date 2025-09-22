// List & Create Assigned Dues
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DueStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId") || undefined;
  const status = (searchParams.get("status") as DueStatus) || undefined;

  const data = await prisma.assignedDues.findMany({
    where: {
      ...(memberId ? { memberId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: { member: true, plan: true, memberCategory: true, payments: true },
  });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    memberId,
    planId,
    memberCategoryId,
    amount,
    currency = "GHS",
    dueDate,
    periodStart,
    periodEnd,
    reference,
    notes,
    status,
  } = body;

  if (!memberId || amount === undefined) {
    return NextResponse.json(
      { error: "memberId and amount are required" },
      { status: 400 }
    );
  }

  const data = await prisma.assignedDues.create({
    data: {
      memberId,
      planId: planId || null,
      memberCategoryId: memberCategoryId || null,
      amount,
      currency,
      dueDate: dueDate ? new Date(dueDate) : null,
      periodStart: periodStart ? new Date(periodStart) : null,
      periodEnd: periodEnd ? new Date(periodEnd) : null,
      reference: reference || null,
      notes: notes || null,
      status: status || "PENDING",
    },
  });

  return NextResponse.json({ data }, { status: 201 });
}
