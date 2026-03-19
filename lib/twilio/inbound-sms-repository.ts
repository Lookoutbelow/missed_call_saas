import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type AdminClient = SupabaseClient<Database>;

export async function findConversationByCustomerPhone(
  supabase: AdminClient,
  accountId: string,
  customerPhone: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("account_id", accountId)
    .eq("contact_phone", customerPhone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createConversation(
  supabase: AdminClient,
  params: {
    accountId: string;
    customerPhone: string;
    contactName?: string | null;
    at: string;
  }
) {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      account_id: params.accountId,
      contact_phone: params.customerPhone,
      contact_name: params.contactName ?? null,
      channel: "sms",
      status: "open",
      last_message_at: params.at,
      updated_at: params.at
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateConversationFromInboundMessage(
  supabase: AdminClient,
  params: {
    conversationId: string;
    body: string;
    at: string;
  }
) {
  const { error } = await supabase
    .from("conversations")
    .update({
      latest_message_preview: params.body,
      last_message_at: params.at,
      status: "open",
      updated_at: params.at
    })
    .eq("id", params.conversationId);

  if (error) {
    throw error;
  }
}

export async function findMessageByProviderSid(
  supabase: AdminClient,
  providerMessageId: string
) {
  const { data, error } = await supabase
    .from("messages")
    .select("id")
    .eq("provider_message_id", providerMessageId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function insertInboundMessage(
  supabase: AdminClient,
  params: {
    accountId: string;
    conversationId: string;
    body: string;
    providerMessageId: string;
    sentAt: string;
  }
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      account_id: params.accountId,
      conversation_id: params.conversationId,
      provider_message_id: params.providerMessageId,
      direction: "inbound",
      sender_type: "customer",
      body: params.body,
      delivery_status: "received",
      sent_at: params.sentAt
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function findLeadByCustomerPhone(
  supabase: AdminClient,
  accountId: string,
  customerPhone: string
) {
  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("account_id", accountId)
    .eq("customer_phone", customerPhone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createLeadFromInboundSms(
  supabase: AdminClient,
  params: {
    accountId: string;
    conversationId: string;
    customerPhone: string;
    serviceCategory: string;
    issueType: string | null;
    urgency: "emergency" | "same_day" | "standard" | null;
    at: string;
  }
) {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      account_id: params.accountId,
      conversation_id: params.conversationId,
      customer_name: params.customerPhone,
      customer_phone: params.customerPhone,
      service_category: params.serviceCategory,
      issue_type: params.issueType,
      urgency: params.urgency ?? "standard",
      source: "inbound_sms",
      status: "new",
      updated_at: params.at
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function touchLeadFromInboundSms(
  supabase: AdminClient,
  params: {
    leadId: string;
    issueType: string | null;
    urgency: "emergency" | "same_day" | "standard" | null;
    at: string;
  }
) {
  const patch: Database["public"]["Tables"]["leads"]["Update"] = {
    updated_at: params.at
  };

  if (params.issueType) {
    patch.issue_type = params.issueType;
  }
  if (params.urgency) {
    patch.urgency = params.urgency;
  }

  const { error } = await supabase.from("leads").update(patch).eq("id", params.leadId);
  if (error) {
    throw error;
  }
}

export async function setOptOutStatus(
  supabase: AdminClient,
  params: {
    accountId: string;
    phoneNumber: string;
    optedOut: boolean;
  }
) {
  const { error } = await supabase.from("opt_outs").upsert(
    {
      account_id: params.accountId,
      phone_number: params.phoneNumber,
      opted_out: params.optedOut
    },
    { onConflict: "account_id,phone_number" }
  );

  if (error) {
    throw error;
  }
}
