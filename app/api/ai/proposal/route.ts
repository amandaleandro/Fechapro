import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { rateLimit, rateLimitError } from "@/lib/rate-limit";

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

const PROPOSAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    clientName: { type: "string" },
    serviceName: { type: "string" },
    price: { type: "number" },
    deadline: { type: "string" },
    payment: { type: "string" },
    included: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
    upsell: { type: "string" },
    sendMessage: { type: "string" },
  },
  required: ["clientName", "serviceName", "price", "deadline", "payment", "included", "notes", "upsell", "sendMessage"],
};

export async function POST(request: Request) {
  const session = await requireSession();
  if (!rateLimit(`ai:${session.id}`, 20, 60 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as {
    prompt?: string;
  };

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return jsonError("Informe um rascunho para gerar a proposta.");
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      source: "fallback",
      proposal: buildFallbackProposal(prompt),
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Você é especialista em propostas comerciais para prestadores de serviço no Brasil. Responda somente JSON válido.",
        },
        {
          role: "user",
          content: `Transforme este rascunho em uma proposta comercial objetiva e persuasiva: ${prompt}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "proposal_draft",
          strict: true,
          schema: PROPOSAL_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json({
      source: "fallback",
      proposal: buildFallbackProposal(prompt),
    });
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) {
    return NextResponse.json({
      source: "fallback",
      proposal: buildFallbackProposal(prompt),
    });
  }

  try {
    return NextResponse.json({
      source: "openai",
      proposal: JSON.parse(raw),
    });
  } catch {
    return NextResponse.json({
      source: "fallback",
      proposal: buildFallbackProposal(prompt),
    });
  }
}

function buildFallbackProposal(prompt: string) {
  const valueMatch = prompt.match(/(?:r\$|valor|investimento)\s*(?:de|:)?\s*([\d.,]+)/i);
  const deadlineMatch = prompt.match(/(?:prazo|em)\s*(?:de|:)?\s*([\w\s]+?)(?:,|\.|$)/i);
  const service = prompt.split(",")[0]?.trim() || "Serviço personalizado";

  return {
    clientName: "",
    serviceName: service.charAt(0).toUpperCase() + service.slice(1),
    price: valueMatch ? Number(valueMatch[1].replace(/\./g, "").replace(",", ".")) : 0,
    deadline: deadlineMatch ? deadlineMatch[1].trim() : "",
    payment: prompt.toLowerCase().includes("50") ? "50% na entrada e 50% na entrega" : "A combinar",
    included: ["Diagnóstico inicial", "Execução do serviço principal", "Ajustes combinados em proposta", "Entrega final organizada"],
    notes: "Proposta válida até a data informada. Alterações de escopo podem gerar novo orçamento.",
    upsell: "Considere oferecer um pacote complementar para aumentar o valor do contrato.",
    sendMessage: "Segue uma proposta profissional para avaliação. Fico à disposição para ajustar qualquer detalhe.",
  };
}
