type ProposalNotificationEvent = "viewed" | "accepted" | "declined" | "paid";

type ProposalNotificationInput = {
  clientName: string;
  serviceName: string;
  slug: string;
};

const eventText: Record<Exclude<ProposalNotificationEvent, "viewed">, { title: string; action: string }> = {
  accepted: {
    title: "Proposta aprovada",
    action: "aprovou",
  },
  declined: {
    title: "Proposta recusada",
    action: "recusou",
  },
  paid: {
    title: "Proposta paga",
    action: "pagou",
  },
};

export function proposalNotification(event: ProposalNotificationEvent, input: ProposalNotificationInput) {
  if (event === "viewed") {
    return {
      title: `${input.clientName} abriu sua proposta`,
      body: `Sua proposta de ${input.serviceName} foi visualizada agora. Este pode ser um bom momento para fazer um contato rapido.`,
      slug: input.slug,
      tag: `proposal-${input.slug}-${event}`,
    };
  }

  const text = eventText[event];

  return {
    title: text.title,
    body: `O cliente ${input.clientName} ${text.action} a proposta de ${input.serviceName}.`,
    slug: input.slug,
    tag: `proposal-${input.slug}-${event}`,
  };
}
