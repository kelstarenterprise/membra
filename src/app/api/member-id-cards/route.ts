// List & Create Member ID Cards
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CardStatus } from "@prisma/client";
import { idCardGenerator, type MemberCardData, type CardGenerationOptions } from "@/lib/id-card-generator";
import { auth } from "@/auth";
import type { SessionUser } from "@/types/auth";

export async function GET(req: NextRequest) {
  // Check authentication
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId") || undefined;
  const status = (searchParams.get("status") as CardStatus) || undefined;
  const q = searchParams.get("q") || undefined; // cardNumber search
  const generate = searchParams.get("generate") === "true"; // Generate card flag

  // If this is a generation request
  if (generate && memberId) {
    return handleCardGeneration(memberId, sessionUser);
  }

  // Regular listing - restrict access for non-admin users
  let whereClause = {
    ...(memberId ? { memberId } : {}),
    ...(status ? { status } : {}),
    ...(q ? { cardNumber: { contains: q, mode: "insensitive" as const } } : {}),
  };

  // If user is not admin, only show their own cards
  if (sessionUser.role !== "ADMIN") {
    if (sessionUser.memberId) {
      whereClause = { ...whereClause, memberId: sessionUser.memberId };
    } else {
      return NextResponse.json({ data: [] }); // No member ID associated
    }
  }

  const data = await prisma.memberIdCard.findMany({
    where: whereClause,
    include: {
      member: {
        select: {
          firstName: true,
          lastName: true,
          membershipId: true,
          status: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  // Check admin authentication
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

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
    generateCard = false,
    cardFormat = "pdf",
  } = body;

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 }
    );
  }

  try {
    let finalCardNumber = cardNumber;
    let finalQrData = qrData;
    let finalFrontImageUrl = frontImageUrl;
    let finalBackImageUrl = backImageUrl;

    // If generateCard is true, generate the card automatically
    if (generateCard) {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: { memberCategory: true },
      });

      if (!member) {
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 }
        );
      }

      // Transform member data for card generation
      const memberCardData: MemberCardData = {
        id: member.id,
        membershipId: member.membershipId,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        dateOfBirth: member.dateOfBirth,
        membershipLevel: member.membershipLevel,
        status: member.status,
        nationality: member.nationality,
        passportPictureUrl: member.passportPictureUrl,
        memberCategory: member.memberCategory,
        createdAt: member.createdAt,
      };

      const options: CardGenerationOptions = {
        format: cardFormat as 'pdf' | 'png' | 'jpeg',
        includeBack: true,
      };

      const generatedCard = await idCardGenerator.generateCard(memberCardData, options);
      
      finalCardNumber = generatedCard.cardNumber;
      finalQrData = generatedCard.qrData;
      
      if (generatedCard.frontImageUrl) finalFrontImageUrl = generatedCard.frontImageUrl;
      if (generatedCard.backImageUrl) finalBackImageUrl = generatedCard.backImageUrl;
    }

    if (!finalCardNumber) {
      return NextResponse.json(
        { error: "cardNumber is required when not auto-generating" },
        { status: 400 }
      );
    }

    const data = await prisma.memberIdCard.create({
      data: {
        memberId,
        cardNumber: finalCardNumber,
        issuedAt: issuedAt ? new Date(issuedAt) : (generateCard ? new Date() : null),
        expiresAt: expiresAt ? new Date(expiresAt) : (generateCard ? new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) : null),
        status: generateCard ? "PRINTED" : status,
        frontImageUrl: finalFrontImageUrl || null,
        backImageUrl: finalBackImageUrl || null,
        qrData: finalQrData || null,
        generationCount: generateCard ? 1 : undefined,
        lastGeneratedAt: generateCard ? new Date() : undefined,
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            membershipId: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error creating ID card:", error);
    return NextResponse.json(
      { error: "Failed to create ID card" },
      { status: 500 }
    );
  }
}

// Helper function to handle card generation requests
async function handleCardGeneration(memberId: string, sessionUser: SessionUser) {
  try {
    // Check if user can access this member's data
    if (sessionUser.role !== "ADMIN" && sessionUser.memberId !== memberId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { memberCategory: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Transform member data for card generation
    const memberCardData: MemberCardData = {
      id: member.id,
      membershipId: member.membershipId,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      membershipLevel: member.membershipLevel,
      status: member.status,
      nationality: member.nationality,
      passportPictureUrl: member.passportPictureUrl,
      memberCategory: member.memberCategory,
      createdAt: member.createdAt,
    };

    const options: CardGenerationOptions = {
      format: 'pdf',
      includeBack: true,
    };

    const generatedCard = await idCardGenerator.generateCard(memberCardData, options);
    
    // Return the PDF as a downloadable response
    if (generatedCard.pdfBuffer) {
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `attachment; filename="${member.firstName}_${member.lastName}_ID_Card.pdf"`);
      
      return new Response(new Uint8Array(generatedCard.pdfBuffer), { headers });
    }

    return NextResponse.json(
      { error: "Failed to generate card" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error generating card:", error);
    return NextResponse.json(
      { error: "Failed to generate card" },
      { status: 500 }
    );
  }
}
