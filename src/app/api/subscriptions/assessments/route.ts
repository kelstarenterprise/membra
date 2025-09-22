import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TargetType } from "@/types/subscription";

export async function GET() {
  try {
    // For now, return AssignedDues grouped by assessment criteria
    // This is a simplified approach - you might want a separate Assessment table
    const assignedDues = await prisma.assignedDues.findMany({
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            memberCategory: {
              select: {
                name: true,
              },
            },
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: assignedDues });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, period, targetType, targetLevel, memberIds } = body;

    // Validate required fields
    if (!planId || !period) {
      return NextResponse.json(
        { error: "planId and period are required" },
        { status: 400 }
      );
    }

    // Verify plan exists
    const plan = await prisma.duesPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    let targetMembers: Array<{
      id: string;
      memberCategoryId: string | null;
    }> = [];

    if (targetType === 'INDIVIDUAL' && memberIds) {
      // Get specific members
      targetMembers = await prisma.member.findMany({
        where: {
          id: { in: memberIds },
          status: 'ACTIVE',
        },
      });
    } else if (targetType === 'LEVEL' && targetLevel) {
      // Get members by category/level
      targetMembers = await prisma.member.findMany({
        where: {
          status: 'ACTIVE',
          memberCategory: {
            name: targetLevel,
          },
        },
      });
    }

    if (targetMembers.length === 0) {
      return NextResponse.json(
        { error: "No target members found" },
        { status: 400 }
      );
    }

    // Create assigned dues for each member
    const assignedDues = await Promise.all(
      targetMembers.map(member => 
        prisma.assignedDues.create({
          data: {
            memberId: member.id,
            planId: plan.id,
            memberCategoryId: member.memberCategoryId,
            amount: plan.amount,
            currency: plan.currency,
            periodStart: new Date(`${period}-01`),
            periodEnd: new Date(`${period}-31`),
            dueDate: new Date(`${period}-31`),
            status: 'PENDING',
            reference: `${plan.code}-${period}-${member.id}`,
            notes: `Assessment for ${period}`,
          },
        })
      )
    );

    const responseData = {
      id: `assessment_${Date.now()}`,
      planId: plan.id,
      planName: plan.name,
      period,
      targetType: targetType as TargetType,
      targetLevel,
      memberIds: targetMembers.map(m => m.id),
      assignedDuesCount: assignedDues.length,
      createdAt: new Date().toISOString(),
      createdBy: "admin", // You'd get this from auth session
    };

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
}
