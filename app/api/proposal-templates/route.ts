import crypto from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { saveFile } from "@/lib/storage";
import { cleanOptionalString, cleanString, cleanStringList, normalizePrice } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

export async function GET() {
  const session = await requireSession();
  const items = await prisma.proposalTemplateAsset.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await requireSession();
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Envie um arquivo de template.");
    if (!allowedTypes.has(file.type)) return jsonError("Use PDF, imagem, CSV ou planilha XLS/XLSX.");
    if (file.size > 10 * 1024 * 1024) return jsonError("O arquivo pode ter no máximo 10MB.");

    const price = normalizePrice(Number(form.get("price") || 0));
    const title = cleanString(String(form.get("title") || ""));
    const serviceName = cleanString(String(form.get("serviceName") || ""));
    const deadline = cleanString(String(form.get("deadline") || ""));
    const niche = cleanOptionalString(String(form.get("niche") || "")) || "Template importado";
    const payment = cleanOptionalString(String(form.get("payment") || ""));
    const notes = cleanOptionalString(String(form.get("notes") || ""));
    const included = cleanStringList(String(form.get("included") || "").split("\n"));

    if (!title || !serviceName || !deadline) return jsonError("Título, serviço e prazo são obrigatórios.");
    if (price === null || price <= 0) return jsonError("Informe um valor maior que zero.");

    const extension = path.extname(file.name) || extensionFromType(file.type);
    const bytes = Buffer.from(await file.arrayBuffer());
    const sourceFileUrl = await saveFile(`template-${crypto.randomUUID()}${extension}`, bytes, file.type);

    const item = await prisma.proposalTemplateAsset.create({
      data: {
        userId: session.id,
        niche,
        title,
        serviceName,
        price,
        deadline,
        payment: payment || "",
        included,
        notes: notes || "",
        sourceFileUrl,
        sourceFileName: file.name,
        sourceFileType: file.type,
      },
    });
    return NextResponse.json(item, { status: 201 });
  }

  return jsonError("Envie o template usando multipart/form-data.");
}

function extensionFromType(type: string) {
  if (type === "application/pdf") return ".pdf";
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "text/csv") return ".csv";
  return ".xlsx";
}
