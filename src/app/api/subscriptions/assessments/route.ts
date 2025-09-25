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
    console.log('Assessment POST request body:', JSON.stringify(body, null, 2));
    
    const { planId, period, targetType, targetCategory, memberIds } = body;

    // Enhanced validation with detailed error messages
    if (!planId || !period) {
      console.error('Validation failed: Missing required fields', { planId, period });
      return NextResponse.json(
        { 
          error: "planId and period are required",
          details: { planId: !!planId, period: !!period }
        },
        { status: 400 }
      );
    }

    // Validate targetType
    if (!targetType || !['CATEGORY', 'INDIVIDUAL'].includes(targetType)) {
      console.error('Validation failed: Invalid targetType', { targetType });
      return NextResponse.json(
        { 
          error: "targetType must be either 'CATEGORY' or 'INDIVIDUAL'",
          received: targetType
        },
        { status: 400 }
      );
    }

    // Validate targetType-specific fields
    if (targetType === 'CATEGORY' && !targetCategory) {
      console.error('Validation failed: targetCategory required for CATEGORY type', { targetCategory });
      return NextResponse.json(
        { 
          error: "targetCategory is required when targetType is 'CATEGORY'",
          received: { targetType, targetCategory }
        },
        { status: 400 }
      );
    }

    if (targetType === 'INDIVIDUAL' && (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0)) {
      console.error('Validation failed: memberIds required for INDIVIDUAL type', { memberIds });
      return NextResponse.json(
        { 
          error: "memberIds array is required when targetType is 'INDIVIDUAL'",
          received: { targetType, memberIds }
        },
        { status: 400 }
      );
    }

    // Verify plan exists
    console.log('Looking up plan:', planId);
    const plan = await prisma.duesPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      console.error('Plan not found:', planId);
      return NextResponse.json(
        { error: "Plan not found", planId },
        { status: 404 }
      );
    }
    console.log('Plan found:', { id: plan.id, name: plan.name, code: plan.code });

    let targetMembers: Array<{
      id: string;
      memberCategoryId: string | null;
    }> = [];

    if (targetType === 'INDIVIDUAL' && memberIds) {
      console.log('Fetching individual members:', memberIds);
      console.log('MemberIds type and content:', typeof memberIds, Array.isArray(memberIds), memberIds);
      
      // Ensure memberIds is an array and contains valid IDs
      const validMemberIds = Array.isArray(memberIds) ? memberIds.filter(id => id && typeof id === 'string') : [];
      console.log('Valid member IDs:', validMemberIds);
      
      if (validMemberIds.length === 0) {
        console.error('No valid member IDs provided');
        return NextResponse.json(
          { 
            error: "No valid member IDs provided",
            received: { memberIds, validCount: 0 }
          },
          { status: 400 }
        );
      }
      
      // Get specific members (include PROSPECT, PENDING, and ACTIVE - exclude SUSPENDED)
      targetMembers = await prisma.member.findMany({
        where: {
          id: { in: validMemberIds },
          status: { in: ['PROSPECT', 'PENDING', 'ACTIVE'] },
        },
        select: {
          id: true,
          memberCategoryId: true,
        }
      });
      console.log('Found individual members:', targetMembers.length, 'out of', validMemberIds.length, 'requested');
    } else if (targetType === 'CATEGORY' && targetCategory) {
      console.log('Fetching members by category:', targetCategory);
      // Get members by category (include PROSPECT, PENDING, and ACTIVE - exclude SUSPENDED)
      targetMembers = await prisma.member.findMany({
        where: {
          status: { in: ['PROSPECT', 'PENDING', 'ACTIVE'] },
          memberCategory: {
            name: targetCategory,
          },
        },
        select: {
          id: true,
          memberCategoryId: true,
        }
      });
      console.log('Found category members:', targetMembers.length);
    }

    if (targetMembers.length === 0) {
      console.error('No target members found', { targetType, targetCategory, memberIds });
      return NextResponse.json(
        { 
          error: "No target members found",
          details: { targetType, targetCategory, memberIds, totalFound: 0 }
        },
        { status: 400 }
      );
    }

    // Validate and parse period format
    console.log('Validating period format:', period);
    const periodRegex = /^\d{4}-\d{2}$/; // YYYY-MM format
    if (!periodRegex.test(period)) {
      console.error('Invalid period format:', period);
      return NextResponse.json(
        { 
          error: "Period must be in YYYY-MM format (e.g., '2025-01')",
          received: period
        },
        { status: 400 }
      );
    }

    const [year, month] = period.split('-');
    const periodStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const periodEnd = new Date(parseInt(year), parseInt(month), 0); // Last day of month
    const dueDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month

    console.log('Creating assigned dues for members:', {
      count: targetMembers.length,
      planId: plan.id,
      period,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString()
    });

    // Create assigned dues for each member
    let assignedDues;
    try {
      assignedDues = await Promise.all(
        targetMembers.map(member => 
          prisma.assignedDues.create({
            data: {
              memberId: member.id,
              planId: plan.id,
              memberCategoryId: member.memberCategoryId,
              amount: plan.amount,
              currency: plan.currency,
              periodStart,
              periodEnd,
              dueDate,
              status: 'PENDING',
              reference: `${plan.code}-${period}-${member.id}`,
              notes: `Assessment for ${period}`,
            },
          })
        )
      );
      
      console.log('Successfully created assigned dues:', assignedDues.length);
    } catch (dbError) {
      console.error('Database error creating assigned dues:', dbError);
      return NextResponse.json(
        { 
          error: "Failed to create assigned dues",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

    const responseData = {
      id: `assessment_${Date.now()}`,
      planId: plan.id,
      planName: plan.name,
      period,
      targetType: targetType as TargetType,
      targetCategory,
      memberIds: targetMembers.map(m => m.id),
      assignedDuesCount: assignedDues.length,
      createdAt: new Date().toISOString(),
      createdBy: "admin", // You'd get this from auth session
    };

    console.log('Assessment completed successfully:', responseData);
    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
}
