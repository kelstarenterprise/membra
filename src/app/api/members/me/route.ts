// src/app/api/members/me/route.ts
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MemberService } from "@/lib/members";

// GET /api/members/me - Get current authenticated member
export async function GET() {
  try {
    const cookieStore = await cookies();
    const id = cookieStore.get("memberId")?.value;

    if (!id) {
      // For demo purposes, return the first member if no auth
      // In production, return 401 Unauthorized
      const members = await MemberService.getAllMembers();
      const member = members[0] || null;
      
      if (!member) {
        return NextResponse.json(
          { error: "No members found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ data: member });
    }

    const member = await MemberService.getMemberById(id);
    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: member });
  } catch (error) {
    console.error('Error fetching member profile:', error);
    return NextResponse.json(
      { error: "Failed to fetch member profile" },
      { status: 500 }
    );
  }
}

// PUT /api/members/me - Update current authenticated member
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const id = cookieStore.get("memberId")?.value;
    
    const body = await req.json();
    
    if (!id) {
      // For demo purposes, update the first member if no auth
      const members = await MemberService.getAllMembers();
      if (members.length === 0) {
        return NextResponse.json(
          { error: "No members found" },
          { status: 404 }
        );
      }
      
      const memberId = members[0].id;
      const updated = await MemberService.updateMember(memberId, body);
      
      if (!updated) {
        return NextResponse.json(
          { error: "Failed to update member profile" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: updated });
    }
    
    const updated = await MemberService.updateMember(id, body);
    
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update member profile" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating member profile:', error);
    
    // Handle database constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: "Email or national ID already in use" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update member profile" },
      { status: 500 }
    );
  }
}
