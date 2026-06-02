import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export function uploadDir() {
  return process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
}

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

  await mkdir(uploadDir(), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ uploadDir(), path.basename(filename)), bytes);
  return `/api/uploads/${filename}`;
}

export async function readLocalFile(filename: string): Promise<Buffer | null> {
  try {
    const safeFilename = path.basename(filename);
    return await readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ uploadDir(), safeFilename));
  } catch {
    return null;
  }
}

export async function readUploadedFile(filename: string): Promise<Buffer | null> {
  const safeFilename = path.basename(filename);

  try {
    return await readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ uploadDir(), safeFilename));
  } catch {
    // fall through to S3
  }

  if (!isS3Enabled()) return null;

  try {
    const client = s3Client()!;
    const response = await client.send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: safeFilename })
    );
    if (!response.Body) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}
