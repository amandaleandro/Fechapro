import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, cleanStringList, isValidEmail, isValidPhone, normalizePrice } from "@/lib/validation";

type ImportKind = "clients" | "services" | "testimonials";

type ImportBody = {
  kind?: ImportKind;
  rows?: string[][];
};

const maxRows = 500;

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as ImportBody;
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, maxRows + 1) : [];

  if (!body.kind || !["clients", "services", "testimonials"].includes(body.kind)) {
    return jsonError("Tipo de importacao invalido.");
  }
  if (rows.length < 2) return jsonError("A planilha precisa ter cabecalho e pelo menos uma linha.");
  if (rows.length > maxRows + 1) return jsonError(`Importe no maximo ${maxRows} linhas por vez.`);

  if (body.kind === "clients") return importClients(session.id, rows);
  if (body.kind === "services") return importServices(session.id, rows);
  return importTestimonials(session.id, rows);
}

async function importClients(userId: string, rows: string[][]) {
  const { errors, items } = mapRows(rows, (row, line) => {
    const item = {
      name: cleanString(row.nome ?? row.nome_cliente ?? row.cliente),
      email: cleanOptionalString(row.email),
      phone: cleanOptionalString(row.telefone ?? row.whatsapp ?? row.celular),
      segment: cleanOptionalString(row.segmento),
      interestService: cleanOptionalString(row.servico_interesse ?? row.servico ?? row.interesse),
      status: cleanOptionalString(row.status) || "lead",
      notes: cleanOptionalString(row.observacoes ?? row.observacao ?? row.notas),
    };
    if (!item.name) return { error: `Linha ${line}: nome obrigatorio.` };
    if (item.email && !isValidEmail(item.email)) return { error: `Linha ${line}: e-mail invalido.` };
    if (item.phone && !isValidPhone(item.phone)) return { error: `Linha ${line}: telefone invalido.` };
    return { item: { ...item, userId } };
  });
  const created = await prisma.$transaction(items.map((data) => prisma.clientAsset.create({ data: data! })));
  return NextResponse.json({ created, errors });
}

async function importServices(userId: string, rows: string[][]) {
  const { errors, items } = mapRows(rows, (row, line) => {
    const price = normalizeImportedPrice(row.valor_base ?? row.valor ?? row.preco ?? 0);
    const item = {
      name: cleanString(row.servico ?? row.nome ?? row.nome_servico),
      price,
      deadline: cleanOptionalString(row.prazo_padrao ?? row.prazo),
      includes: cleanStringList(String(row.itens_inclusos ?? row.inclusos ?? "").split(/\n|\|/)),
    };
    if (!item.name) return { error: `Linha ${line}: servico obrigatorio.` };
    if (item.price === null || item.price < 0) return { error: `Linha ${line}: valor invalido.` };
    return { item: { ...item, price: item.price, userId } };
  });
  const created = await prisma.$transaction(items.map((data) => prisma.serviceAsset.create({ data: data! })));
  return NextResponse.json({ created, errors });
}

async function importTestimonials(userId: string, rows: string[][]) {
  const { errors, items } = mapRows(rows, (row, line) => {
    const item = {
      authorName: cleanString(row.nome_cliente ?? row.nome ?? row.cliente),
      company: cleanOptionalString(row.empresa),
      quote: cleanString(row.depoimento ?? row.comentario ?? row.quote),
    };
    if (!item.authorName || !item.quote) return { error: `Linha ${line}: nome e depoimento sao obrigatorios.` };
    return { item: { ...item, userId } };
  });
  const created = await prisma.$transaction(items.map((data) => prisma.testimonialAsset.create({ data: data! })));
  return NextResponse.json({ created, errors });
}

function mapRows<T>(
  rows: string[][],
  map: (row: Record<string, string>, line: number) => { item: T } | { error: string },
) {
  const headers = rows[0].map(normalizeHeader);
  const errors: string[] = [];
  const items: T[] = [];

  rows.slice(1).forEach((cells, index) => {
    const line = index + 2;
    const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] || ""]));
    const result = map(row, line);
    if ("item" in result) items.push(result.item);
    else errors.push(result.error);
  });

  return { errors, items };
}

function normalizeImportedPrice(value: unknown) {
  if (typeof value === "string") {
    return normalizePrice(value.replace(/\./g, "").replace(",", "."));
  }
  return normalizePrice(value);
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
