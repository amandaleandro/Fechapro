import path from "node:path";
import { NextResponse } from "next/server";
import { readLocalUploadFile } from "@/lib/local-upload-file";

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  const safeFilename = path.basename(filename);

  const file = await readLocalUploadFile(safeFilename);
  if (!file) {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": contentTypeFor(safeFilename),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

function contentTypeFor(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };

  return types[extension] || "application/octet-stream";
}
