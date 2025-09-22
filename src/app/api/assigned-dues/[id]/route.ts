// Read / Update / Delete Assigned Due
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const data = await prisma.assignedDues.findUnique({
    where: { id },
    include: { member: true, plan: true, payments: true },
  });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  if (body.dueDate) body.dueDate = new Date(body.dueDate);
  if (body.periodStart) body.periodStart = new Date(body.periodStart);
  if (body.periodEnd) body.periodEnd = new Date(body.periodEnd);

  const data = await prisma.assignedDues.update({ where: { id }, data: body });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.assignedDues.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
