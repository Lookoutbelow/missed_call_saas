import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type AdminClient = SupabaseClient<Database>;

export async function getConversationNotificationContext(
  supabase: AdminClient,
  conversationId: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, account_id, contact_phone, latest_message_preview, last_message_at, missed_call_id")
    .eq("id", conversationId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAccountNotificationContext(
  supabase: AdminClient,
  accountId: string
) {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, business_name, twilio_phone_number")
    .eq("id", accountId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getNotificationSettings(
  supabase: AdminClient,
  accountId: string
) {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("missed_call_sms_enabled, missed_call_email_enabled, escalation_phone, notification_emails")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getMissedCallAutoTextState(
  supabase: AdminClient,
  missedCallId: string
) {
  const { data, error } = await supabase
    .from("missed_calls")
    .select("id, auto_text_sent, auto_text_sent_at")
    .eq("id", missedCallId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function countInboundCustomerMessages(
  supabase: AdminClient,
  conversationId: string
) {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .eq("sender_type", "customer");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function hasRecentNotificationEvent(
  supabase: AdminClient,
  params: {
    conversationId: string;
    eventType: string;
    sinceIso: string;
  }
) {
  const { data, error } = await supabase
    .from("notification_events")
    .select("id")
    .eq("conversation_id", params.conversationId)
    .eq("event_type", params.eventType)
    .gte("created_at", params.sinceIso)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function createNotificationEvent(
  supabase: AdminClient,
  params: {
    accountId: string;
    conversationId: string;
    eventType: string;
    sentChannels: string[];
    payload: Database["public"]["Tables"]["notification_events"]["Insert"]["payload"];
  }
) {
  const { error } = await supabase.from("notification_events").insert({
    account_id: params.accountId,
    conversation_id: params.conversationId,
    event_type: params.eventType,
    sent_channels: params.sentChannels,
    payload: params.payload
  });

  if (error) {
    throw error;
  }
}
