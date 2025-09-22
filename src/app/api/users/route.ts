import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    // hide passwordHash
    const data = users.map(({ passwordHash, ...u }) => {
      void passwordHash; // Acknowledge we're intentionally not using it
      return u;
    });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list users" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      username,
      role = "MEMBER",
      memberId = null,
      password = "ChangeMe123!",
    } = body as {
      email: string;
      username: string;
      role?: "ADMIN" | "MEMBER";
      memberId?: string | null;
      password?: string;
    };

    if (!email || !username) {
      return NextResponse.json(
        { error: "email and username required" },
        { status: 400 }
      );
    }

    // optional: validate member exists if provided
    if (memberId) {
      const found = await prisma.member.findUnique({ where: { id: memberId } });
      if (!found)
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 }
        );
    }

    const passwordHash = await hash(password, 10);

    const created = await prisma.user.create({
      data: {
        email,
        username,
        role,
        memberId,
        passwordHash,
      },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const { passwordHash: _hashedPassword, ...safe } = created;
    void _hashedPassword; // Acknowledge we're intentionally not using it
    return NextResponse.json({ data: safe }, { status: 201 });
  } catch (e) {
    // handle unique constraint errors etc.
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create user" },
      { status: 500 }
    );
  }
}
