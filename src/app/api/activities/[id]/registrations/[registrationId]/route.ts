// Update / Delete a specific Registration
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string; registrationId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { registrationId } = await ctx.params;
  const body = await req.json();
  const data = await prisma.activityRegistration.update({
    where: { id: registrationId },
    data: body,
  });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { registrationId } = await ctx.params;
  await prisma.activityRegistration.delete({ where: { id: registrationId } });
  return NextResponse.json({ ok: true });
}
