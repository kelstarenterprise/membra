import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;
    const { password } = (await req.json()) as { password?: string };
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }
    const passwordHash = await hash(password, 10);
    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update password" },
      { status: 500 }
    );
  }
}
