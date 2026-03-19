export type InboxConversationListItem = {
  id: string;
  contactName: string | null;
  contactPhone: string;
  status: "open" | "qualified" | "booked" | "closed";
  latestMessagePreview: string | null;
  lastMessageAt: string | null;
};

export type InboxMessage = {
  id: string;
  body: string;
  direction: "inbound" | "outbound";
  senderType: "customer" | "system" | "team_member";
  sentAt: string;
  deliveryStatus: "queued" | "sent" | "delivered" | "failed" | "received";
};

export type LeadSummary = {
  id: string | null;
  customerPhone: string | null;
  issueType: string | null;
  urgency: "emergency" | "same_day" | "standard" | null;
  address: string | null;
  status: "new" | "qualified" | "quoted" | "won" | "lost" | null;
  notes: string | null;
};

export type InboxConversationDetail = {
  conversation: InboxConversationListItem;
  messages: InboxMessage[];
  lead: LeadSummary;
  replyState: {
    isOptedOut: boolean;
    canReply: boolean;
    reason: string | null;
  };
};
