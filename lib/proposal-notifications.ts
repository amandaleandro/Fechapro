type ProposalNotificationEvent = "viewed" | "accepted" | "declined" | "paid";

type ProposalNotificationInput = {
  clientName: string;
  serviceName: string;
  slug: string;
};

const eventText: Record<ProposalNotificationEvent, { title: string; action: string }> = {
  viewed: {
    title: "Proposta visualizada",
    action: "abriu",
  },
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
  const text = eventText[event];

  return {
    title: text.title,
    body: `O cliente ${input.clientName} ${text.action} a proposta de ${input.serviceName}.`,
    slug: input.slug,
    tag: `proposal-${input.slug}-${event}`,
  };
}
