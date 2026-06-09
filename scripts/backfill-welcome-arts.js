// Backfill do lote único de artes de boas-vindas para founders que compraram
// ANTES da migração para o modelo de lote único (commit que zerou o artLimit
// recorrente dos planos vitalícios e passou a semear welcomeArtCredits na ativação).
//
// Esses clientes recebiam artes pelo artLimit mensal (agora 0) e nunca tiveram
// um lote semeado em artCreditBalance — sem o backfill ficariam sem artes.
//
// Idempotente: grava os IDs já processados em scripts/.backfill-welcome-arts.json
// e os ignora em re-execuções. Não altera o schema.
//
// Uso:
//   node scripts/backfill-welcome-arts.js --dry-run            # apenas mostra o que faria
//   node scripts/backfill-welcome-arts.js                      # aplica
//   node scripts/backfill-welcome-arts.js --before=2026-06-09  # só assinaturas iniciadas antes da data
//
// IMPORTANTE: rode UMA vez, junto do deploy desta mudança. Novos cadastros já
// entram com o lote semeado pela rota de signup, então não devem ser incluídos.
// Use --before com a data/hora do deploy para excluir cadastros novos com segurança.

const { PrismaClient } = require("@prisma/client");
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

// Espelha lib/plans.ts (welcomeArtCredits dos planos vitalícios). Mantenha em sincronia.
const WELCOME_ART_CREDITS = {
  founder_start: 5,
  founder_professional: 15,
  founder_complete_site: 20,
  founder: 50,
};

const PROCESSED_FILE = resolve(process.cwd(), "scripts/.backfill-welcome-arts.json");

loadEnvFiles();

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const beforeArg = args.find((arg) => arg.startsWith("--before="));
const before = beforeArg ? new Date(beforeArg.split("=")[1]) : null;
if (before && Number.isNaN(before.getTime())) {
  throw new Error(`Data inválida em --before. Use o formato ISO, ex.: --before=2026-06-09`);
}

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
  }
}

function loadEnvFiles() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");
}

function loadProcessed() {
  if (!existsSync(PROCESSED_FILE)) return new Set();
  try {
    return new Set(JSON.parse(readFileSync(PROCESSED_FILE, "utf8")));
  } catch {
    return new Set();
  }
}

function saveProcessed(set) {
  writeFileSync(PROCESSED_FILE, JSON.stringify([...set], null, 2));
}

async function main() {
  const processed = loadProcessed();
  const founderPlans = Object.keys(WELCOME_ART_CREDITS);

  const where = { plan: { in: founderPlans } };
  if (before) where.startedAt = { lt: before };

  const subscriptions = await prisma.planSubscription.findMany({
    where,
    select: { id: true, userId: true, plan: true, status: true, artCreditBalance: true, startedAt: true, user: { select: { email: true } } },
    orderBy: { startedAt: "asc" },
  });

  let credited = 0;
  let skipped = 0;

  for (const sub of subscriptions) {
    const credits = WELCOME_ART_CREDITS[sub.plan];
    if (processed.has(sub.id)) {
      skipped += 1;
      continue;
    }

    const label = `${sub.user?.email || sub.userId} · ${sub.plan} · saldo atual ${sub.artCreditBalance}`;
    if (dryRun) {
      console.log(`[dry-run] +${credits} artes → ${label}`);
    } else {
      await prisma.planSubscription.update({
        where: { id: sub.id },
        data: { artCreditBalance: { increment: credits } },
      });
      processed.add(sub.id);
      console.log(`+${credits} artes → ${label}`);
    }
    credited += 1;
  }

  if (!dryRun) saveProcessed(processed);

  console.log("");
  console.log(`Founders encontrados: ${subscriptions.length}`);
  console.log(`${dryRun ? "Seriam creditados" : "Creditados"}: ${credited}`);
  console.log(`Já processados (ignorados): ${skipped}`);
  if (dryRun) console.log("\nNada foi gravado (--dry-run). Rode sem --dry-run para aplicar.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
