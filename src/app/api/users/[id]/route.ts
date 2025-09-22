import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;
    const id = params.id;
    const body = await req.json();
    const { email, username, role, memberId } = body as Partial<{
      email: string;
      username: string;
      role: "ADMIN" | "MEMBER";
      memberId: string | null;
    }>;

    if (memberId) {
      const found = await prisma.member.findUnique({ where: { id: memberId } });
      if (!found)
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 }
        );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { email, username, role, memberId },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    const { passwordHash, ...safe } = updated as typeof updated & { passwordHash?: string };
    // Remove passwordHash from response
    void passwordHash;
    return NextResponse.json({ data: safe });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const params = await segmentData.params;
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
