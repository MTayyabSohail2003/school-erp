import { createClient } from '@/lib/supabase/client';

export const storageApi = {
    /**
     * Pure function to upload a file to a specific Supabase bucket.
     * Returns the public URL of the uploaded file.
     */
    uploadDocument: async (file: File, bucketName: string = 'documents'): Promise<string> => {
        const supabase = createClient();

        // Generate a unique file name to prevent collisions
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `vault/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get the public URL
        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
