type ProposalNotificationEvent = "viewed" | "accepted" | "declined" | "paid";

type ProposalNotificationInput = {
  clientName: string;
  serviceName: string;
  slug: string;
};

const eventText: Record<
  Exclude<ProposalNotificationEvent, "viewed">,
  {
    title: string;
    body: (input: ProposalNotificationInput) => string;
  }
> = {
  accepted: {
    title: "Proposta aprovada",
    body: (input) =>
      `${input.clientName} aprovou a proposta de ${input.serviceName}. Agora é um bom momento para combinar os próximos passos.`,
  },
  declined: {
    title: "Proposta recusada",
    body: (input) =>
      `${input.clientName} recusou a proposta de ${input.serviceName}. Você ainda pode entrar em contato para entender o motivo e tentar recuperar essa venda.`,
  },
  paid: {
    title: "Pagamento confirmado",
    body: (input) =>
      `${input.clientName} realizou o pagamento da proposta de ${input.serviceName}. O serviço já pode seguir para a próxima etapa.`,
  },
};

export function proposalNotification(
  event: ProposalNotificationEvent,
  input: ProposalNotificationInput,
) {
  if (event === "viewed") {
    return {
      title: `${input.clientName} visualizou sua proposta`,
      body: `A proposta de ${input.serviceName} acabou de ser aberta. Esse é um ótimo momento para chamar o cliente e tirar dúvidas antes que ele esfrie.`,
      slug: input.slug,
      tag: `proposal-${input.slug}-${event}`,
    };
  }

  const text = eventText[event];

  return {
    title: text.title,
    body: text.body(input),
    slug: input.slug,
    tag: `proposal-${input.slug}-${event}`,
  };
}
