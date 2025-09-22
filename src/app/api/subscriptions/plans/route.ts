import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.duesPlan.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ data: plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      );
    }

    const plan = await prisma.duesPlan.create({
      data: {
        name: body.name,
        code: body.code,
        description: body.description || null,
        amount: body.amount || 0,
        currency: body.currency || "GHS",
        cycle: body.billingCycle || "ONE_TIME",
        active: body.active ?? true,
      },
    });
    
    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}
