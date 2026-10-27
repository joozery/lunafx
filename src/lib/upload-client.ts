// Browser-side helpers for file uploads (KYC documents, deposit slips).

const MAX_SIDE = 2000; // px — still sharp enough to read an ID card or a slip QR code

/**
 * Re-encode a large phone photo as a JPEG of at most MAX_SIDE px so it uploads fast and stays
 * under proxy body limits. PDFs, small files and images the browser can't decode (e.g. HEIC
 * outside Safari) are returned unchanged.
 */
export async function shrinkImage(file: File, maxBytes = 1_000_000): Promise<File> {
  const isImage = file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
  if (!isImage || (file.size <= maxBytes && /^image\/(jpeg|png|webp)$/.test(file.type))) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob || (blob.size >= file.size && /^image\/(jpeg|png|webp)$/.test(file.type))) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Parse an upload response, turning proxy errors (HTML pages such as nginx 413) into Thai messages. */
export async function readUploadResponse<T extends { error?: string }>(res: Response): Promise<T> {
  if (res.status === 413) return { error: "ไฟล์ใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 10MB หรือถ่ายรูปใหม่" } as T;
  try {
    return await res.json() as T;
  } catch {
    return { error: `อัปโหลดไม่สำเร็จ (รหัส ${res.status}) กรุณาลองใหม่อีกครั้ง` } as T;
  }
}
