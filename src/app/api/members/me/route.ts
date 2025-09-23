// src/app/api/users/me/route.ts
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth";
import type { MemberProfileResponse, ApiErrorResponse } from "@/types/members";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" } as ApiErrorResponse,
        { status: 401 }
      );
    }

    const sessionUser = session.user as SessionUser;
    if (!sessionUser.id) {
      return NextResponse.json(
        { error: "User ID not found" } as ApiErrorResponse,
        { status: 400 }
      );
    }

    const userId = sessionUser.id;
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        member: {
          select: {
            id: true,
            membershipId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            membershipLevel: true,
            status: true,
            memberCategory: { select: { code: true, name: true } },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" } as ApiErrorResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({ data: profile } as MemberProfileResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch profile";
    return NextResponse.json(
      { error: errorMessage } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
