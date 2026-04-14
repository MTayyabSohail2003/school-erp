/**
 * Converts a Base64 data URL string to a File object.
 * Useful for uploading cropped images from components like ImageCropper to Supabase Storage.
 * 
 * @param base64String The data URL string (e.g., "data:image/png;base64,..." or just base64 data)
 * @param fileName The name to give to the resulting file
 * @returns A File object
 */
export function base64ToFile(base64String: string, fileName: string = 'cropped-image.png'): File {
    // If the string contains the data URL prefix, strip it
    const arr = base64String.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr.length > 1 ? arr[1] : arr[0]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], fileName, { type: mime });
}
