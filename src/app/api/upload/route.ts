import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/lib/fileUpload';
import type { SessionUser } from '@/types/auth';

export const runtime = 'nodejs';

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * RBAC - Require authenticated user (Admin or Member)
 */
async function requireAuth() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  
  if (!sessionUser?.role || !['ADMIN', 'MEMBER'].includes(sessionUser.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return null; // No error, user is authorized
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const authError = await requireAuth();
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' } as UploadResponse,
        { status: 400 }
      );
    }

    // Upload the file
    const result = await uploadFile(file);

    if (result.success) {
      return NextResponse.json({
        success: true,
        url: result.publicUrl,
      } as UploadResponse);
    } else {
      return NextResponse.json(
        { success: false, error: result.error } as UploadResponse,
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Upload endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload file' 
      } as UploadResponse,
      { status: 500 }
    );
  }
}

// For preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}