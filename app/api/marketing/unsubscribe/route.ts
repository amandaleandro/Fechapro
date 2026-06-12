import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function page(title: string, message: string, status: number) {
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title}</title>
    <style>
      body { margin: 0; background: #f1f5f9; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #0f172a; }
      .card { max-width: 460px; margin: 12vh auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 12px 40px rgba(15,23,42,.08); text-align: center; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      p { line-height: 1.6; color: #475569; margin: 0 0 20px; }
      a { display: inline-block; background: #106b5b; color: #fff; text-decoration: none; font-weight: 700; padding: 12px 20px; border-radius: 10px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="${APP_URL}">Voltar ao FechaPro</a>
    </div>
  </body>
</html>`;

  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!token) {
    return page("Link inválido", "Este link de descadastro está incompleto ou expirou.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { marketingUnsubscribeToken: token },
    select: { id: true, marketingUnsubscribedAt: true },
  });

  if (!user) {
    return page("Link inválido", "Não encontramos um cadastro para este link de descadastro.", 404);
  }

  if (!user.marketingUnsubscribedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { marketingUnsubscribedAt: new Date() },
    });
  }

  return page(
    "Descadastro confirmado",
    "Você não receberá mais emails de marketing e ativação do FechaPro. Os emails essenciais (proposta, aceite, pagamento e senha) continuam ativos.",
    200,
  );
}
