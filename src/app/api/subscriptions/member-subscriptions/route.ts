import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: list all assigned dues (member subscriptions)
// ?status=PAID|PENDING|WAIVED&period=YYYY-MM&level=Gold&memberId=m1
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const period = searchParams.get("period");
    const level = searchParams.get("level");
    const memberId = searchParams.get("memberId");

    const where: Record<string, unknown> = {};
    
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    
    if (period) {
      const startDate = new Date(`${period}-01`);
      const endDate = new Date(`${period}-31`);
      where.periodStart = { gte: startDate };
      where.periodEnd = { lte: endDate };
    }
    
    if (level) {
      where.memberCategory = {
        name: level,
      };
    }

    const assignedDues = await prisma.assignedDues.findMany({
      where,
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
        memberCategory: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match expected format
    const data = assignedDues.map(due => ({
      id: due.id,
      memberId: due.memberId,
      memberName: `${due.member.firstName} ${due.member.lastName}`,
      level: due.memberCategory?.name || null,
      planId: due.planId,
      planName: due.plan?.name || 'Unknown Plan',
      amount: Number(due.amount),
      currency: due.currency,
      period: due.periodStart ? due.periodStart.toISOString().slice(0, 7) : '',
      status: due.status,
      assessmentId: `assessment_${due.planId}_${due.periodStart?.toISOString().slice(0, 7)}`,
      createdAt: due.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching member subscriptions:', error);
    return NextResponse.json(
      { error: "Failed to fetch member subscriptions" },
      { status: 500 }
    );
  }
}

// PATCH: bulk update status of selected member-subscriptions
// body: { ids: string[], status: "PAID" | "PENDING" | "WAIVED" }
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { ids, status } = body;
    
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: "No ids provided" }, { status: 400 });
    }
    
    if (!['PAID', 'PENDING', 'WAIVED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await prisma.assignedDues.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: status,
      },
    });

    return NextResponse.json({ 
      updated: result.count, 
      at: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error updating member subscriptions:', error);
    return NextResponse.json(
      { error: "Failed to update member subscriptions" },
      { status: 500 }
    );
  }
}
