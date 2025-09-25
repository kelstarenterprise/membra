import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

export interface UploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
}

export interface UploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  uploadDir?: string;
}

const DEFAULT_OPTIONS: Required<UploadOptions> = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  uploadDir: 'uploads/members',
};

/**
 * Generate a unique filename with timestamp and random hash
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomHash = randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop() || '';
  return `${timestamp}_${randomHash}.${extension}`;
}

/**
 * Validate file type and size
 */
function validateFile(file: File, options: Required<UploadOptions>): { valid: boolean; error?: string } {
  if (file.size > options.maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds limit of ${options.maxSizeBytes / (1024 * 1024)}MB`
    };
  }

  if (!options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Upload a file to the server
 */
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Validate file
    const validation = validateFile(file, finalOptions);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    
    // Create full path
    const uploadPath = join(process.cwd(), 'public', finalOptions.uploadDir);
    const filePath = join(uploadPath, filename);
    
    // Ensure upload directory exists
    await mkdir(uploadPath, { recursive: true });

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Generate public URL
    const publicUrl = `/${finalOptions.uploadDir}/${filename}`;

    return {
      success: true,
      filePath,
      publicUrl,
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(files: File[], options: UploadOptions = {}): Promise<UploadResult[]> {
  const promises = files.map(file => uploadFile(file, options));
  return Promise.all(promises);
}