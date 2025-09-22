import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const planId = searchParams.get("planId");
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to"); // YYYY-MM-DD

    const where: Record<string, unknown> = {};
    
    if (memberId) where.memberId = memberId;
    if (planId) where.planId = planId;
    
    if (from || to) {
      where.paidAt = {} as { gte?: Date; lte?: Date };
      if (from) (where.paidAt as { gte?: Date }).gte = new Date(from);
      if (to) (where.paidAt as { lte?: Date }).lte = new Date(to);
    }

    const payments = await prisma.payment.findMany({
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
      },
      orderBy: { paidAt: 'desc' },
    });

    // Transform to match expected format
    const data = payments.map(payment => ({
      id: payment.id,
      memberId: payment.memberId,
      memberName: payment.member ? `${payment.member.firstName} ${payment.member.lastName}` : 'Unknown',
      planId: payment.planId,
      planName: payment.plan?.name || 'Unknown Plan',
      amount: Number(payment.amount),
      currency: payment.currency,
      paidAt: payment.paidAt.toISOString(),
      reference: payment.reference,
      createdAt: payment.createdAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { memberId, planId, amount, paidAt, reference, assignedDueId, method = 'CASH' } = body;

    // Validate required fields
    if (!memberId || !amount || !paidAt) {
      return NextResponse.json(
        { error: "memberId, amount, and paidAt are required" },
        { status: 400 }
      );
    }

    if (Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
    }

    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Verify plan exists if planId is provided
    let plan = null;
    if (planId) {
      plan = await prisma.duesPlan.findUnique({
        where: { id: planId },
      });
      if (!plan) {
        return NextResponse.json(
          { error: "Plan not found" },
          { status: 404 }
        );
      }
    }

    // Verify assignedDue exists if assignedDueId is provided
    let assignedDue = null;
    if (assignedDueId) {
      assignedDue = await prisma.assignedDues.findUnique({
        where: { id: assignedDueId },
      });
      if (!assignedDue) {
        return NextResponse.json(
          { error: "Assigned due not found" },
          { status: 404 }
        );
      }
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        memberId,
        planId: planId || null,
        assignedDueId: assignedDueId || null,
        amount,
        currency: plan?.currency || assignedDue?.currency || 'GHS',
        method,
        paidAt: new Date(paidAt),
        reference: reference?.trim() || null,
        description: `Payment for ${plan?.name || assignedDue ? 'assigned dues' : 'general payment'}`,
      },
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
      },
    });

    // If this payment is for an assigned due, update the due status
    if (assignedDue && amount >= Number(assignedDue.amount)) {
      await prisma.assignedDues.update({
        where: { id: assignedDueId },
        data: { status: 'PAID' },
      });
    }

    // Transform response
    const responseData = {
      id: payment.id,
      memberId: payment.memberId,
      memberName: `${payment.member.firstName} ${payment.member.lastName}`,
      planId: payment.planId,
      planName: payment.plan?.name || null,
      amount: Number(payment.amount),
      currency: payment.currency,
      paidAt: payment.paidAt.toISOString(),
      reference: payment.reference,
      createdAt: payment.createdAt.toISOString(),
    };

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
