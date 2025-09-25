import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getServerRole } from "@/lib/getRole";
import { getDashboardStats } from "@/lib/dashboard";

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getServerRole();
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get dashboard statistics using utility function
    const stats = await getDashboardStats();

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}