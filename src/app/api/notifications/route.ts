// List & Create Notifications
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId") || undefined;
  const unread = searchParams.get("unread") === "true";

  const data = await prisma.notification.findMany({
    where: {
      ...(memberId ? { memberId } : {}),
      ...(unread ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { memberId, title, body: message, channel = "IN_APP", sentAt } = body;

  if (!memberId || !title || !message) {
    return NextResponse.json(
      { error: "memberId, title and body are required" },
      { status: 400 }
    );
  }

  const data = await prisma.notification.create({
    data: {
      memberId,
      title,
      body: message,
      channel,
      sentAt: sentAt ? new Date(sentAt) : null,
    },
  });

  return NextResponse.json({ data }, { status: 201 });
}
