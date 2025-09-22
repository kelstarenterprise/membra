// src/app/api/members/[id]/route.ts
export const revalidate = 0;
export const dynamic = "force-dynamic";
// Do NOT set runtime = "edge" when using Prisma.

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MemberService, type UpdateMemberInput } from "@/lib/members";

// ---- helpers ----
function isValidDateString(d: unknown): d is string {
  if (typeof d !== "string") return false;
  const n = Date.parse(d);
  return !Number.isNaN(n);
}

/**
 * If any "level-like" fields are present, resolve to a valid memberCategoryId.
 * Accepts:
 *  - memberCategoryId (verify it exists)
 *  - memberCategoryCode (e.g., "GOLD")
 *  - legacy "level" (e.g., "GOLD")
 */
async function resolveMemberCategoryId(
  patch: Partial<UpdateMemberInput> & {
    memberCategoryId?: string;
    memberCategoryCode?: string;
    level?: string;
  }
) {
  // 1) If id explicitly provided, verify it exists
  if (patch.memberCategoryId) {
    const exists = await prisma.memberCategory.findUnique({
      where: { id: patch.memberCategoryId },
      select: { id: true },
    });
    if (!exists) {
      throw new Error(`memberCategoryId not found: ${patch.memberCategoryId}`);
    }
    return patch.memberCategoryId;
  }

  // 2) If a code or legacy level string provided, map to id
  const code = patch.memberCategoryCode ?? patch.level; // legacy input like "GOLD"
  if (typeof code === "string" && code.trim()) {
    const cat = await prisma.memberCategory.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true },
    });
    if (!cat) throw new Error(`Unknown member category code: ${code}`);
    return cat.id;
  }

  // 3) Nothing provided => no change
  return undefined;
}

// ---------- GET /api/members/:id ----------
export async function GET(
  _req: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await segmentData.params;
    const member = await MemberService.getMemberById(id);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ data: member });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

// ---------- PATCH /api/members/:id ----------
export async function PATCH(
  req: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await segmentData.params;

    const body = (await req.json()) as Partial<UpdateMemberInput> & {
      memberCategoryId?: string;
      memberCategoryCode?: string;
      level?: string;
    };

    const patch: Partial<UpdateMemberInput> = { ...body };

    // Normalize dateOfBirth if supplied
    if (patch.dateOfBirth !== undefined) {
      if (!isValidDateString(patch.dateOfBirth)) {
        return NextResponse.json(
          {
            error:
              "Invalid dateOfBirth. Use an ISO date string (e.g., 1990-01-01).",
          },
          { status: 400 }
        );
      }
      patch.dateOfBirth = new Date(patch.dateOfBirth).toISOString();
    }

    // Resolve MemberCategory if any level-ish field provided
    const willUpdateLevel =
      body.memberCategoryId !== undefined ||
      body.memberCategoryCode !== undefined ||
      body.level !== undefined;

    if (willUpdateLevel) {
      try {
        const memberCategoryId = await resolveMemberCategoryId(body);
        if (memberCategoryId !== undefined) {
          (patch as Partial<UpdateMemberInput> & { memberCategoryId?: string }).memberCategoryId = memberCategoryId;
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // Remove helper fields not in UpdateMemberInput before passing to service
    delete (patch as Partial<UpdateMemberInput> & { memberCategoryCode?: string; level?: string }).memberCategoryCode;
    delete (patch as Partial<UpdateMemberInput> & { memberCategoryCode?: string; level?: string }).level;

    const updated = await MemberService.updateMember(id, patch);

    if (!updated) {
      return NextResponse.json(
        { error: "Member not found or failed to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating member:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "A member with a unique field already exists (email, phone, or national ID).",
          meta: error.meta,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// ---------- PUT /api/members/:id (alias to PATCH) ----------
export async function PUT(
  req: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  return PATCH(req, segmentData);
}

// ---------- DELETE /api/members/:id ----------
export async function DELETE(
  _req: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await segmentData.params;
    const deleted = await MemberService.deleteMember(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Member not found or failed to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
