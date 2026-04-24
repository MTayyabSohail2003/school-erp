/**
 * Global application configuration
 * Values are pulled from environment variables with safe fallbacks
 */

export const UPLOAD_LIMITS = {
    // Limits in Kilobytes (KB)
    MAX_IMAGE_SIZE_KB: Number(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_KB) || 30,
    MAX_DOC_SIZE_KB: Number(process.env.NEXT_PUBLIC_MAX_DOC_SIZE_KB) || 1024,
    
    // Helper to get raw bytes
    get MAX_IMAGE_BYTES() { return this.MAX_IMAGE_SIZE_KB * 1024 },
    get MAX_DOC_BYTES() { return this.MAX_DOC_SIZE_KB * 1024 }
};
