import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hash } from "bcrypt";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(6),
  // Optional: allow linking to an existing Member if you want
  memberId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = RegisterSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );
    }
    const { email, username, password, memberId } = parsed.data;

    // Uniqueness checks
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true, email: true, username: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email or username already in use." },
        { status: 409 }
      );
    }

    // If memberId is supplied, make sure it exists
    if (memberId) {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
      });
      if (!member) {
        return NextResponse.json(
          { error: "Member not found." },
          { status: 404 }
        );
      }
      // Also ensure no user already linked to this member (memberId unique on User)
      const linked = await prisma.user.findUnique({ where: { memberId } });
      if (linked) {
        return NextResponse.json(
          { error: "A user is already linked to this member." },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hash(password, 10);

    const created = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: "MEMBER", // self-registrations are members by default
        memberId: memberId ?? null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        memberId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Handle unique constraint just in case of race
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Email or username already in use." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Registration failed." },
      { status: 500 }
    );
  }
}
