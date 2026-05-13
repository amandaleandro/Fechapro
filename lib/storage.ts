import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function s3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey || !process.env.S3_BUCKET) return null;
  return new S3Client({ endpoint, region, credentials: { accessKeyId, secretAccessKey } });
}

function isS3Enabled() {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );
}

export async function saveFile(
  filename: string,
  bytes: Buffer,
  contentType: string
): Promise<string> {
  if (isS3Enabled()) {
    const client = s3Client()!;
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: filename,
        Body: bytes,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    const publicUrl = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
    return publicUrl ? `${publicUrl}/${filename}` : `/api/uploads/${filename}`;
  }

  await mkdir(path.join(process.cwd(), "uploads"), { recursive: true });
  await writeFile(path.join(process.cwd(), "uploads", path.basename(filename)), bytes);
  return `/api/uploads/${filename}`;
}

export async function readLocalFile(filename: string): Promise<Buffer | null> {
  try {
    const safeFilename = path.basename(filename);
    return await readFile(path.join(process.cwd(), "uploads", safeFilename));
  } catch {
    return null;
  }
}
