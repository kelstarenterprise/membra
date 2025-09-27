// Member Search API
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { SessionUser } from "@/types/auth";

export async function GET(req: NextRequest) {
  // Check admin authentication
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || "10")));
    const includeCardInfo = searchParams.get("includeCardInfo") === "true";

    if (!query && !includeCardInfo) {
      return NextResponse.json({ 
        data: [],
        message: "Please provide a search query"
      });
    }

    const whereClause = query ? {
      OR: [
        { firstName: { contains: query, mode: "insensitive" as const } },
        { lastName: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
        { phone: { contains: query, mode: "insensitive" as const } },
        { nationalId: { contains: query, mode: "insensitive" as const } },
        { membershipId: { contains: query, mode: "insensitive" as const } },
      ],
    } : {};

    const members = await prisma.member.findMany({
      where: whereClause,
      include: {
        memberCategory: {
          select: {
            code: true,
            name: true,
          }
        },
        ...(includeCardInfo && {
          idCards: {
            select: {
              id: true,
              cardNumber: true,
              status: true,
              generationCount: true,
              lastGeneratedAt: true,
              issuedAt: true,
              expiresAt: true,
            },
            orderBy: {
              lastGeneratedAt: "desc"
            }
          }
        })
      },
      take: limit,
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" }
      ]
    });

    // Transform the data to include card statistics
    const transformedMembers = members.map(member => ({
      id: member.id,
      membershipId: member.membershipId,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      status: member.status,
      membershipLevel: member.membershipLevel,
      memberCategory: member.memberCategory,
      passportPictureUrl: member.passportPictureUrl,
      createdAt: member.createdAt,
      ...(includeCardInfo && {
        idCards: member.idCards,
        cardStats: {
          hasCards: member.idCards?.length > 0,
          totalCards: member.idCards?.length || 0,
          totalGenerations: member.idCards?.reduce((sum, card) => sum + (card.generationCount || 0), 0) || 0,
          lastGenerated: member.idCards?.[0]?.lastGeneratedAt || null,
          latestCardStatus: member.idCards?.[0]?.status || null,
        }
      })
    }));

    return NextResponse.json({
      data: transformedMembers,
      query,
      count: transformedMembers.length,
      hasMore: transformedMembers.length === limit
    });

  } catch (error) {
    console.error("Error searching members:", error);
    return NextResponse.json(
      { error: "Failed to search members" },
      { status: 500 }
    );
  }
}