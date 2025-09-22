// Read / Update / Delete Activity
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const data = await prisma.activity.findUnique({
    where: { id },
    include: { registrations: true },
  });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();

  if (body.startsAt) body.startsAt = new Date(body.startsAt);
  if (body.endsAt) body.endsAt = new Date(body.endsAt);

  const data = await prisma.activity.update({ where: { id }, data: body });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
