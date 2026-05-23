import { readUploadedFile } from "@/lib/storage";

export async function readLocalUploadFile(filename: string): Promise<Buffer | null> {
  return readUploadedFile(filename);
}
