// Bulk ID Card Generation API
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { idCardGenerator, type MemberCardData, type CardGenerationOptions } from "@/lib/id-card-generator";
import { auth } from "@/auth";
import type { SessionUser } from "@/types/auth";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  // Check admin authentication
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      memberIds = [],
      filters = {},
      format = "pdf",
      includeBack = true,
    } = body;

    let members;

    if (memberIds.length > 0) {
      // Generate cards for specific members
      members = await prisma.member.findMany({
        where: {
          id: { in: memberIds }
        },
        include: { memberCategory: true },
      });
    } else {
      // Generate cards based on filters
      const whereClause: Record<string, unknown> = {};
      
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.membershipLevel) {
        whereClause.membershipLevel = filters.membershipLevel;
      }
      if (filters.memberCategoryId) {
        whereClause.memberCategoryId = filters.memberCategoryId;
      }
      
      members = await prisma.member.findMany({
        where: whereClause,
        include: { memberCategory: true },
        take: 100, // Limit to prevent overwhelming the server
      });
    }

    if (!members.length) {
      return NextResponse.json({ error: "No members found" }, { status: 404 });
    }

    // Transform members data for card generation
    const membersCardData: MemberCardData[] = members.map(member => ({
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
    }));

    const options: CardGenerationOptions = {
      format: format as 'pdf' | 'png' | 'jpeg',
      includeBack,
    };

    // Generate cards for all members
    const generatedCards = await idCardGenerator.generateBatchCards(membersCardData, options);

    if (format === 'pdf') {
      // Create a ZIP file containing all PDFs
      const zip = new JSZip();
      
      for (const [memberId, card] of generatedCards) {
        const member = members.find(m => m.id === memberId);
        if (member && card.pdfBuffer) {
          const filename = `${member.firstName}_${member.lastName}_ID_Card.pdf`;
          zip.file(filename, card.pdfBuffer);
        }
      }

      const zipUint8Array = await zip.generateAsync({ type: "uint8array" });
      const zipBuffer = Buffer.from(zipUint8Array);
      
      const headers = new Headers();
      headers.set('Content-Type', 'application/zip');
      headers.set('Content-Disposition', `attachment; filename="Member_ID_Cards_${new Date().toISOString().split('T')[0]}.zip"`);
      
      return new Response(new Uint8Array(zipBuffer), { headers });
    } else {
      // For image formats, return metadata about generated cards
      const results = Array.from(generatedCards.entries()).map(([memberId, card]) => {
        const member = members.find(m => m.id === memberId);
        return {
          memberId,
          memberName: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
          cardNumber: card.cardNumber,
          frontImageUrl: card.frontImageUrl,
          backImageUrl: card.backImageUrl,
        };
      });
      
      return NextResponse.json({ 
        message: `Generated ${results.length} cards`,
        cards: results 
      });
    }

  } catch (error) {
    console.error("Error in bulk card generation:", error);
    return NextResponse.json(
      { error: "Failed to generate cards" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Check admin authentication
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    
    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    // Check if member exists
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
    
    // Create or update the member's ID card record
    const existingCard = await prisma.memberIdCard.findFirst({
      where: {
        memberId: member.id,
        cardNumber: generatedCard.cardNumber,
      }
    });
    
    if (existingCard) {
      await prisma.memberIdCard.update({
        where: { id: existingCard.id },
        data: {
          status: "PRINTED",
          issuedAt: new Date(),
        }
      });
    } else {
      await prisma.memberIdCard.create({
        data: {
          memberId: member.id,
          cardNumber: generatedCard.cardNumber,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
          status: "PRINTED",
          qrData: generatedCard.qrData,
        }
      });
    }
    
    // Return the PDF as a downloadable response
    if (generatedCard.pdfBuffer) {
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `attachment; filename="${member.firstName}_${member.lastName}_ID_Card.pdf"`);
      
      return new Response(new Uint8Array(generatedCard.pdfBuffer), { headers });
    }

    return NextResponse.json({ error: "Failed to generate card" }, { status: 500 });

  } catch (error) {
    console.error("Error generating single card:", error);
    return NextResponse.json(
      { error: "Failed to generate card" },
      { status: 500 }
    );
  }
}