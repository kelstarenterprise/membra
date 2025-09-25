import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assignedDueId, status } = body;

    // Validate required fields
    if (!assignedDueId || !status) {
      return NextResponse.json(
        { error: "assignedDueId and status are required" },
        { status: 400 }
      );
    }

    // Validate status value
    if (!['PENDING', 'PARTIAL', 'PAID'].includes(status)) {
      return NextResponse.json(
        { error: "status must be one of: PENDING, PARTIAL, PAID" },
        { status: 400 }
      );
    }

    // Verify assigned due exists
    const assignedDue = await prisma.assignedDues.findUnique({
      where: { id: assignedDueId },
    });

    if (!assignedDue) {
      return NextResponse.json(
        { error: "Assigned due not found" },
        { status: 404 }
      );
    }

    // Update the status
    const updatedAssignedDue = await prisma.assignedDues.update({
      where: { id: assignedDueId },
      data: { status },
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

    console.log(`Updated assigned due ${assignedDueId} status to ${status}`);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAssignedDue.id,
        status: updatedAssignedDue.status,
        amount: Number(updatedAssignedDue.amount),
        currency: updatedAssignedDue.currency,
        dueDate: updatedAssignedDue.dueDate?.toISOString() || '',
        memberName: `${updatedAssignedDue.member.firstName} ${updatedAssignedDue.member.lastName}`,
        planName: updatedAssignedDue.plan?.name || '',
      }
    });
  } catch (error) {
    console.error('Error updating assigned due status:', error);
    return NextResponse.json(
      { error: "Failed to update assigned due status" },
      { status: 500 }
    );
  }
}