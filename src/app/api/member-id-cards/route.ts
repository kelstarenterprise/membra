// List & Create Member ID Cards
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CardStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId") || undefined;
  const status = (searchParams.get("status") as CardStatus) || undefined;
  const q = searchParams.get("q") || undefined; // cardNumber search

  const data = await prisma.memberIdCard.findMany({
    where: {
      ...(memberId ? { memberId } : {}),
      ...(status ? { status } : {}),
      ...(q ? { cardNumber: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    memberId,
    cardNumber,
    issuedAt,
    expiresAt,
    status = "PENDING",
    frontImageUrl,
    backImageUrl,
    qrData,
  } = body;

  if (!memberId || !cardNumber) {
    return NextResponse.json(
      { error: "memberId and cardNumber are required" },
      { status: 400 }
    );
  }

  const data = await prisma.memberIdCard.create({
    data: {
      memberId,
      cardNumber,
      issuedAt: issuedAt ? new Date(issuedAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      status,
      frontImageUrl: frontImageUrl || null,
      backImageUrl: backImageUrl || null,
      qrData: qrData || null,
    },
  });

  return NextResponse.json({ data }, { status: 201 });
}
