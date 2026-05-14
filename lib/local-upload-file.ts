import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/storage";

export async function readLocalUploadFile(filename: string): Promise<Buffer | null> {
  try {
    const safeFilename = path.basename(filename);
    return await readFile(path.join(uploadDir(), safeFilename));
  } catch {
    return null;
  }
}
