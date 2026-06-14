type ProposalDocumentKind = "recibo" | "contrato" | "pdf";

const documentLabels: Record<
  ProposalDocumentKind,
  {
    title: string;
    eyebrow: string;
    description: string;
    benefit: string;
  }
> = {
  recibo: {
    title: "Recibo de pagamento",
    eyebrow: "Recurso premium",
    description:
      "Gere recibos profissionais em PDF para entregar ao cliente após o pagamento.",
    benefit:
      "Passe mais confiança, organize seus comprovantes e deixe seu atendimento mais profissional.",
  },
  contrato: {
    title: "Contrato em PDF",
    eyebrow: "Recurso premium",
    description:
      "Gere contratos em PDF para formalizar o serviço antes de começar o trabalho.",
    benefit:
      "Reduza desalinhamentos com o cliente e deixe as condições do serviço mais claras.",
  },
  pdf: {
    title: "Proposta em PDF",
    eyebrow: "Recurso premium",
    description:
      "Exporte suas propostas comerciais em PDF para enviar de forma profissional.",
    benefit:
      "Apresente seu serviço com mais valor e aumente a confiança antes do cliente decidir.",
  },
};

const PRIMARY = "#16A34A";

export function proposalDocumentUpgradeResponse(kind: ProposalDocumentKind) {
  const { title, eyebrow, description, benefit } = documentLabels[kind];

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title} · FechaPro</title>

    <style>
      :root {
        color-scheme: light;
        --primary: ${PRIMARY};
        --primary-dark: #15803d;
        --primary-soft: #dcfce7;
        --text: #0f172a;
        --muted: #64748b;
        --border: rgba(15, 23, 42, 0.08);
        --card: #ffffff;
        --bg: #f8fafc;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        padding: 24px;
        font-family:
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          Roboto,
          Helvetica,
          Arial,
          sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(22, 163, 74, 0.14), transparent 34%),
          radial-gradient(circle at bottom right, rgba(15, 23, 42, 0.08), transparent 32%),
          var(--bg);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .shell {
        width: 100%;
        max-width: 980px;
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        background: rgba(255, 255, 255, 0.78);
        border: 1px solid var(--border);
        border-radius: 28px;
        box-shadow: 0 30px 80px -45px rgba(15, 23, 42, 0.55);
        overflow: hidden;
        backdrop-filter: blur(14px);
      }

      .content {
        padding: 48px;
        background: var(--card);
      }

      .preview {
        position: relative;
        padding: 48px;
        background:
          linear-gradient(145deg, rgba(22, 163, 74, 0.12), rgba(15, 23, 42, 0.03)),
          #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 28px;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--primary);
      }

      .brand-mark {
        width: 34px;
        height: 34px;
        border-radius: 11px;
        background: var(--primary);
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        letter-spacing: -0.04em;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: var(--primary-soft);
        color: #166534;
        font-size: 13px;
        font-weight: 800;
        margin-bottom: 18px;
      }

      .pill svg {
        width: 16px;
        height: 16px;
      }

      h1 {
        margin: 0;
        font-size: clamp(30px, 5vw, 44px);
        line-height: 1.05;
        letter-spacing: -0.05em;
        font-weight: 900;
        color: var(--text);
      }

      .lead {
        margin: 18px 0 0;
        font-size: 17px;
        line-height: 1.7;
        color: #475569;
      }

      .benefit {
        margin: 20px 0 0;
        padding: 18px;
        border-radius: 18px;
        background: #f8fafc;
        border: 1px solid var(--border);
        color: #334155;
        font-size: 15px;
        line-height: 1.6;
      }

      .actions {
        margin-top: 30px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .cta,
      .secondary {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 14px;
        padding: 14px 18px;
        font-size: 15px;
        font-weight: 900;
        text-decoration: none;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      .cta {
        flex: 1;
        background: var(--primary);
        color: #ffffff;
        box-shadow: 0 16px 30px -18px rgba(22, 163, 74, 0.9);
      }

      .cta:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
      }

      .secondary {
        color: #334155;
        background: #ffffff;
        border: 1px solid var(--border);
      }

      .secondary:hover {
        background: #f8fafc;
        transform: translateY(-1px);
      }

      .microcopy {
        margin-top: 16px;
        font-size: 13px;
        color: var(--muted);
        line-height: 1.5;
      }

      .doc-card {
        width: 100%;
        max-width: 320px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: 0 26px 60px -36px rgba(15, 23, 42, 0.55);
        padding: 24px;
        transform: rotate(-2deg);
      }

      .doc-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 28px;
      }

      .doc-icon {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        background: var(--primary-soft);
        color: var(--primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .doc-tag {
        padding: 6px 10px;
        border-radius: 999px;
        background: #f1f5f9;
        color: #475569;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .doc-title {
        height: 16px;
        width: 78%;
        border-radius: 999px;
        background: #0f172a;
        opacity: 0.9;
        margin-bottom: 12px;
      }

      .doc-line {
        height: 10px;
        border-radius: 999px;
        background: #e2e8f0;
        margin-bottom: 10px;
      }

      .doc-line.short {
        width: 62%;
      }

      .doc-line.medium {
        width: 84%;
      }

      .doc-total {
        margin-top: 26px;
        padding: 16px;
        border-radius: 18px;
        background: #f8fafc;
        border: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .doc-total span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .doc-total strong {
        color: var(--primary);
        font-size: 18px;
      }

      .lock {
        position: absolute;
        right: 36px;
        bottom: 36px;
        width: 58px;
        height: 58px;
        border-radius: 18px;
        background: var(--primary);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 18px 35px -20px rgba(22, 163, 74, 0.9);
      }

      @media (max-width: 820px) {
        body {
          padding: 16px;
          align-items: flex-start;
        }

        .shell {
          grid-template-columns: 1fr;
          border-radius: 22px;
        }

        .content,
        .preview {
          padding: 30px 22px;
        }

        .preview {
          min-height: 320px;
          order: -1;
        }

        .doc-card {
          max-width: 280px;
        }

        .actions {
          flex-direction: column;
        }

        .cta,
        .secondary {
          width: 100%;
        }

        .lock {
          right: 22px;
          bottom: 22px;
        }
      }
    </style>
  </head>

  <body>
    <main class="shell">
      <section class="content">
        <div class="brand">
          <span class="brand-mark">F</span>
          FechaPro
        </div>

        <div class="pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"></path>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          ${eyebrow}
        </div>

        <h1>${title} disponível nos planos pagos</h1>

        <p class="lead">${description}</p>

        <div class="benefit">
          ${benefit}
        </div>

        <div class="actions">
          <a class="cta" href="/#planos">
            Ver planos e assinar
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </a>

          <a class="secondary" href="javascript:history.back()">
            Voltar para proposta
          </a>
        </div>

        <p class="microcopy">
          Ao assinar, você libera documentos profissionais para enviar ao cliente junto com suas propostas.
        </p>
      </section>

      <section class="preview" aria-hidden="true">
        <div class="doc-card">
          <div class="doc-top">
            <div class="doc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path>
                <path d="M14 2v6h6"></path>
                <path d="M9 15h6"></path>
                <path d="M9 11h3"></path>
              </svg>
            </div>
            <span class="doc-tag">PDF</span>
          </div>

          <div class="doc-title"></div>
          <div class="doc-line medium"></div>
          <div class="doc-line"></div>
          <div class="doc-line short"></div>

          <div class="doc-total">
            <span>Documento</span>
            <strong>Premium</strong>
          </div>
        </div>

        <div class="lock">
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
      </section>
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