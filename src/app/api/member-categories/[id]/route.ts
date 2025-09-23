// Read / Update / Delete Member Category
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  MemberCategoryUpdateInput,
  MemberCategoryResponse,
  MemberCategoryErrorResponse,
} from "@/types/member-category";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const data = await prisma.memberCategory.findUnique({ where: { id } });
    if (!data) {
      return NextResponse.json(
        { error: "Member category not found" } as MemberCategoryErrorResponse,
        { status: 404 }
      );
    }
    return NextResponse.json({ data } as MemberCategoryResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch member category";
    return NextResponse.json(
      { error: errorMessage } as MemberCategoryErrorResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json() as MemberCategoryUpdateInput;
    
    const data = await prisma.memberCategory.update({
      where: { id },
      data: body,
    });
    
    return NextResponse.json({ data } as MemberCategoryResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update member category";
    return NextResponse.json(
      { error: errorMessage } as MemberCategoryErrorResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await prisma.memberCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete member category";
    return NextResponse.json(
      { error: errorMessage } as MemberCategoryErrorResponse,
      { status: 500 }
    );
  }
}
