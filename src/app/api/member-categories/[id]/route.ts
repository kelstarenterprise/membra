// Read / Update / Delete Member Category
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const data = await prisma.memberCategory.findUnique({ where: { id } });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await (await ctx).params;
  const body = await req.json();
  const data = await prisma.memberCategory.update({
    where: { id },
    data: body,
  });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.memberCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
