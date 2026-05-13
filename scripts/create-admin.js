const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const initialEnvKeys = new Set(Object.keys(process.env));
const loadedEnvKeys = new Set();

loadEnvFiles();

const prisma = new PrismaClient();

const adminName = process.env.ADMIN_NAME || "Administrador Geral";
const adminEmail = (process.env.ADMIN_EMAIL || firstAdminEmail() || "admin@fechapro.local").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "FechaProAdmin123!";

function loadEnvFile(filename, options = {}) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const canOverride = options.overrideLoaded && loadedEnvKeys.has(key) && !initialEnvKeys.has(key);
    if (process.env[key] && !canOverride) continue;
    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
    loadedEnvKeys.add(key);
  }
}

function loadEnvFiles() {
  loadEnvFile(".env");
  if (process.env.NODE_ENV === "production") {
    loadEnvFile(".env.production", { overrideLoaded: true });
  }
  loadEnvFile(".env.local", { overrideLoaded: true });
}

function firstAdminEmail() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)[0];
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      subscription: {
        create: {
          plan: "premium_site",
          provider: "admin",
          status: "active",
        },
      },
    },
    update: {
      name: adminName,
      passwordHash: hashPassword(adminPassword),
      subscription: {
        upsert: {
          create: {
            plan: "premium_site",
            provider: "admin",
            status: "active",
          },
          update: {
            plan: "premium_site",
            provider: "admin",
            status: "active",
          },
        },
      },
    },
    select: {
      email: true,
      name: true,
      subscription: {
        select: {
          plan: true,
          provider: true,
          status: true,
        },
      },
    },
  });

  console.log("Admin pronto:");
  console.log(`- Nome: ${user.name}`);
  console.log(`- Email: ${user.email}`);
  console.log("- Senha: definida a partir de ADMIN_PASSWORD");
  console.log(`- Plano: ${user.subscription?.plan} (${user.subscription?.status}, ${user.subscription?.provider})`);
  console.log("");
  console.log(`Configure ADMIN_EMAILS="${user.email}" no ambiente da aplicacao para liberar /admin somente para este usuario.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
