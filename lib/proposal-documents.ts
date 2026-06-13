type ProposalDocumentKind = "recibo" | "contrato" | "pdf";

const documentLabels: Record<ProposalDocumentKind, { title: string; description: string }> = {
  recibo: {
    title: "Recibo de pagamento",
    description: "A geração de recibos em PDF faz parte dos planos pagos do FechaPro.",
  },
  contrato: {
    title: "Contrato em PDF",
    description: "A geração de contratos em PDF faz parte dos planos pagos do FechaPro.",
  },
  pdf: {
    title: "Proposta em PDF",
    description: "A exportação de propostas em PDF faz parte dos planos pagos do FechaPro.",
  },
};

const PRIMARY = "#16A34A";

/**
 * Resposta HTML de upsell exibida quando o plano do profissional não dá acesso
 * aos documentos da proposta (recibo, contrato, PDF). Usada no lugar de
 * `notFound()` para que a conta free veja um convite para assinar em vez de um 404.
 */
export function proposalDocumentUpgradeResponse(kind: ProposalDocumentKind) {
  const { title, description } = documentLabels[kind];
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title} · FechaPro</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
      }
      .card {
        width: 100%;
        max-width: 460px;
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 20px;
        padding: 40px 32px;
        text-align: center;
        box-shadow: 0 24px 60px -32px rgba(15, 23, 42, 0.35);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: 18px;
        background: #ecfdf5;
        color: ${PRIMARY};
        margin-bottom: 20px;
      }
      .brand {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: ${PRIMARY};
        margin: 0 0 8px;
      }
      h1 {
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 12px;
        line-height: 1.25;
      }
      p {
        font-size: 15px;
        line-height: 1.6;
        color: #475569;
        margin: 0 0 8px;
      }
      .cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        margin-top: 24px;
        padding: 14px 20px;
        border-radius: 12px;
        background: ${PRIMARY};
        color: #ffffff;
        font-size: 16px;
        font-weight: 800;
        text-decoration: none;
      }
      .cta:hover { background: #15803d; }
      .back {
        display: inline-block;
        margin-top: 16px;
        font-size: 14px;
        font-weight: 700;
        color: #64748b;
        text-decoration: none;
      }
      .back:hover { color: #0f172a; }
    </style>
  </head>
  <body>
    <main class="card">
      <span class="badge" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </span>
      <p class="brand">FechaPro</p>
      <h1>Seu plano não tem acesso a este recurso</h1>
      <p>${description}</p>
      <p>Assine para ter o melhor do FechaPro: ${title.toLowerCase()}, contratos, propostas em PDF e muito mais.</p>
      <a class="cta" href="/#planos">Ver planos e assinar</a>
      <a class="back" href="javascript:history.back()">Voltar</a>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status: 402,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
