import { NextResponse } from "next/server";
import sharp from "sharp";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { saveFile } from "@/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGE_PIXELS = 20_000_000;
const MAX_IMAGE_SIDE = 2400;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`upload:${ip}`, 30, 60 * 60_000)) {
    return rateLimitError();
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const removeBackground = String(formData.get("removeBackground") || "") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Envie uma imagem JPG, PNG, WEBP ou GIF." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Limite: 5 MB." }, { status: 400 });
  }

  const originalBytes = Buffer.from(await file.arrayBuffer());
  const processed = await processImageUpload(originalBytes, file.type, removeBackground).catch(() => null);

  if (!processed) {
    return NextResponse.json({ error: "Não foi possível processar essa imagem." }, { status: 400 });
  }

  const filename = `${crypto.randomUUID()}${processed.extension}`;
  const imageUrl = await saveFile(filename, processed.bytes, processed.contentType);

  return NextResponse.json({ imageUrl, backgroundRemoved: removeBackground });
}

async function processImageUpload(input: Buffer, contentType: string, removeBackground: boolean) {
  if (removeBackground) {
    return {
      bytes: await removeLightBackground(input),
      contentType: "image/png",
      extension: ".png",
    };
  }

  const base = sharp(input, { animated: false }).rotate();
  await assertSafeImage(base);

  const image = base.resize({
    width: MAX_IMAGE_SIDE,
    height: MAX_IMAGE_SIDE,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (contentType === "image/jpeg") {
    return {
      bytes: await image.jpeg({ quality: 88, mozjpeg: true }).toBuffer(),
      contentType: "image/jpeg",
      extension: ".jpg",
    };
  }

  if (contentType === "image/webp") {
    return {
      bytes: await image.webp({ quality: 86 }).toBuffer(),
      contentType: "image/webp",
      extension: ".webp",
    };
  }

  return {
    bytes: await image.png({ compressionLevel: 9 }).toBuffer(),
    contentType: "image/png",
    extension: ".png",
  };
}

async function removeLightBackground(input: Buffer) {
  const base = sharp(input, { animated: false }).rotate();
  await assertSafeImage(base);

  const image = base
    .resize({
      width: MAX_IMAGE_SIDE,
      height: MAX_IMAGE_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const background = estimateBorderColor(data, info.width, info.height);
  const output = Buffer.from(data);

  for (let index = 0; index < output.length; index += 4) {
    const red = output[index];
    const green = output[index + 1];
    const blue = output[index + 2];
    const alpha = output[index + 3];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const distance = Math.sqrt((red - background.red) ** 2 + (green - background.green) ** 2 + (blue - background.blue) ** 2);
    const neutralLight = max > 218 && max - min < 34;
    const closeToBorder = distance < 58;

    if (alpha > 0 && (neutralLight || closeToBorder)) {
      output[index + 3] = distance < 30 || neutralLight ? 0 : Math.round(alpha * ((distance - 30) / 28));
    }
  }

  return sharp(output, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function assertSafeImage(image: sharp.Sharp) {
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
    throw new Error("Imagem invalida ou grande demais.");
  }
}

function estimateBorderColor(data: Buffer, width: number, height: number) {
  const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 80));
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  function addPixel(x: number, y: number) {
    const index = (y * width + x) * 4;
    const alpha = data[index + 3];
    if (alpha === 0) return;
    red += data[index];
    green += data[index + 1];
    blue += data[index + 2];
    count += 1;
  }

  for (let x = 0; x < width; x += sampleStep) {
    addPixel(x, 0);
    addPixel(x, height - 1);
  }

  for (let y = 0; y < height; y += sampleStep) {
    addPixel(0, y);
    addPixel(width - 1, y);
  }

  if (!count) return { red: 255, green: 255, blue: 255 };

  return {
    red: Math.round(red / count),
    green: Math.round(green / count),
    blue: Math.round(blue / count),
  };
}
