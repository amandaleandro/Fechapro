import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function slugBase(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "") || "proposta";
}

export function slugify(input: string) {
  return `${slugBase(input)}-${randomBytes(6).toString("hex")}`;
}
