import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readLocalUploadFile(filename: string): Promise<Buffer | null> {
  try {
    const safeFilename = path.basename(filename);
    return await readFile(path.join(process.cwd(), "uploads", safeFilename));
  } catch {
    return null;
  }
}
