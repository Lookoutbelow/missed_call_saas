import { createClient } from "@/lib/supabase/server";
import type { InboxConversationDetail, InboxConversationListItem, InboxMessage, LeadSummary } from "@/lib/inbox/types";

function mapConversation(row: {
  id: string;
  contact_name: string | null;
  contact_phone: string;
  status: "open" | "qualified" | "booked" | "closed";
  latest_message_preview: string | null;
  last_message_at: string | null;
}): InboxConversationListItem {
  return {
    id: row.id,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    status: row.status,
    latestMessagePreview: row.latest_message_preview,
    lastMessageAt: row.last_message_at
  };
}

function mapMessage(row: {
  id: string;
  body: string;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "system" | "team_member";
  sent_at: string;
  delivery_status: "queued" | "sent" | "delivered" | "failed" | "received";
}): InboxMessage {
  return {
    id: row.id,
    body: row.body,
    direction: row.direction,
    senderType: row.sender_type,
    sentAt: row.sent_at,
    deliveryStatus: row.delivery_status
  };
}

function emptyLead(contactPhone: string): LeadSummary {
  return {
    id: null,
    customerPhone: contactPhone,
    issueType: null,
    urgency: null,
    address: null,
    status: null,
    notes: null
  };
}

async function getReplyState(accountId: string, contactPhone: string) {
  const supabase = await createClient();
  const accountsQuery = supabase.from("accounts") as any;
  const [{ data: account, error: accountError }, { data: optOut, error: optOutError }] = await Promise.all([
    accountsQuery.select("twilio_phone_number").eq("id", accountId).single() as Promise<{
      data: { twilio_phone_number: string | null } | null;
      error: Error | null;
    }>,
    supabase
      .from("opt_outs")
      .select("id")
      .eq("account_id", accountId)
      .eq("phone_number", contactPhone)
      .eq("opted_out", true)
      .maybeSingle()
  ]);

  if (accountError) {
    throw accountError;
  }
  if (optOutError) {
    throw optOutError;
  }

  if (optOut) {
    return {
      isOptedOut: true,
      canReply: false,
      reason: "Customer has opted out of SMS."
    };
  }

  if (!account?.twilio_phone_number) {
    return {
      isOptedOut: false,
      canReply: false,
      reason: "No Twilio number is assigned to this account yet."
    };
  }

  return {
    isOptedOut: false,
    canReply: true,
    reason: null
  };
}

export async function getInboxConversations(accountId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, contact_name, contact_phone, status, latest_message_preview, last_message_at")
    .eq("account_id", accountId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(mapConversation);
}

export async function getInboxConversationDetail(accountId: string, conversationId: string): Promise<InboxConversationDetail | null> {
  const supabase = await createClient();
  const { data: conversationRow, error: conversationError } = await supabase
    .from("conversations")
    .select("id, contact_name, contact_phone, status, latest_message_preview, last_message_at")
    .eq("account_id", accountId)
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError) {
    throw conversationError;
  }

  if (!conversationRow) {
    return null;
  }

  const { data: messageRows, error: messagesError } = await supabase
    .from("messages")
    .select("id, body, direction, sender_type, sent_at, delivery_status")
    .eq("account_id", accountId)
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });

  if (messagesError) {
    throw messagesError;
  }

  let { data: leadRow, error: leadError } = await supabase
    .from("leads")
    .select("id, customer_phone, issue_type, urgency, address, status, notes")
    .eq("account_id", accountId)
    .eq("conversation_id", conversationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (leadError) {
    throw leadError;
  }

  if (!leadRow) {
    const { data: fallbackLeadRow, error: fallbackLeadError } = await supabase
      .from("leads")
      .select("id, customer_phone, issue_type, urgency, address, status, notes")
      .eq("account_id", accountId)
      .eq("customer_phone", conversationRow.contact_phone)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackLeadError) {
      throw fallbackLeadError;
    }

    leadRow = fallbackLeadRow;
  }

  return {
    conversation: mapConversation(conversationRow),
    messages: messageRows.map(mapMessage),
    lead: leadRow
      ? {
          id: leadRow.id,
          customerPhone: leadRow.customer_phone,
          issueType: leadRow.issue_type,
          urgency: leadRow.urgency,
          address: leadRow.address,
          status: leadRow.status,
          notes: leadRow.notes
        }
      : emptyLead(conversationRow.contact_phone),
    replyState: await getReplyState(accountId, conversationRow.contact_phone)
  };
}
    name: "Milo's Pizza",
    service: "Grease trap emergency",
    neighborhood: "West Palm Beach",
    source: "After-hours missed call",
    responseTime: "19 sec",
    status: "won"
  }
];

export const settingsSections: SettingsSection[] = [
  {
    title: "Text-back automation",
    summary: "Define the first message a missed caller receives and the routing rules behind it.",
    items: [
      "Business-hours and after-hours response templates",
      "Escalation keywords for emergencies",
      "Dispatch handoff timing"
    ]
  },
  {
    title: "Team notifications",
    summary: "Control which dispatchers or plumbers receive new lead alerts.",
    items: [
      "Round-robin assignment",
      "SMS and email notification preferences",
      "Role-based dashboard access"
    ]
  },
  {
    title: "Booking preferences",
    summary: "Configure how recovered calls become booked jobs in your workflow.",
    items: [
      "Lead qualification checklist",
      "Service area filters",
      "CRM field mappings"
    ]
  }
];
