const fs = require("fs");
const nodemailer = require("nodemailer");

function loadEnv(path = ".env") {
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function main() {
  const to = process.argv[2];
  if (!to) {
    throw new Error("Informe o e-mail de destino. Ex: node scripts/test-email.js voce@email.com");
  }

  loadEnv();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || "465"),
    secure: (process.env.SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const result = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Teste de envio - FechaPro",
    html: "<p>Este e um teste de envio SMTP do FechaPro.</p><p>Se chegou aqui, o email esta funcionando.</p>",
  });

  console.log(`OK ${result.messageId || "sem messageId"}`);
}

main().catch((error) => {
  console.error(`ERRO ${error.code || error.message}`);
  process.exit(1);
});
