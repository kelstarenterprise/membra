import { NextResponse } from "next/server";
import { z } from "zod";

// Same validation schema as the main API but with detailed error reporting
const MemberCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z
    .string()
    .min(1)
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  nationalId: z.string().min(1),
  phone: z.string().min(1),
  residentialAddress: z.string().min(1),
  regionConstituencyElectoralArea: z.string().min(1),
  email: z.string().email().optional().nullable(),
  membershipLevel: z.enum(["ORDINARY", "EXECUTIVE", "DELEGATE", "OTHER"]),
  level: z.string().min(1, "Member category is required"),
  status: z.enum(["PROSPECT", "PENDING", "ACTIVE", "SUSPENDED"]).optional(),
});

export async function POST(req: Request) {
  try {
    console.log("🔍 Debug API: Received member creation request");
    
    const json = await req.json();
    console.log("📤 Raw request body:", JSON.stringify(json, null, 2));
    
    // Test validation
    const parsed = MemberCreateSchema.safeParse(json);
    
    if (!parsed.success) {
      console.log("❌ Validation failed:");
      console.log("Errors:", parsed.error.format());
      
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.format(),
          receivedData: json,
          validationErrors: parsed.error.issues,
        },
        { status: 400 }
      );
    }
    
    console.log("✅ Validation passed");
    console.log("📥 Parsed data:", JSON.stringify(parsed.data, null, 2));
    
    return NextResponse.json({
      success: true,
      message: "Validation passed successfully",
      parsedData: parsed.data,
      receivedData: json,
    });
    
  } catch (error) {
    console.error("💥 Debug API Error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}