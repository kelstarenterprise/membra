// Read / Update / Delete Member ID Card
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const data = await prisma.memberIdCard.findUnique({ where: { id } });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();

  if (body.issuedAt) body.issuedAt = new Date(body.issuedAt);
  if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);

  const data = await prisma.memberIdCard.update({ where: { id }, data: body });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.memberIdCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
