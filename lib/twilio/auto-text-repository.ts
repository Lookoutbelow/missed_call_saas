import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type AdminClient = SupabaseClient<Database>;
type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
type MissedCallRow = Database["public"]["Tables"]["missed_calls"]["Row"];

export async function getMissedCallForAutoText(
  supabase: AdminClient,
  missedCallId: string
) {
  const { data, error } = await supabase
    .from("missed_calls")
    .select("id, account_id, caller_name, caller_number, caller_phone, called_number, call_sid, auto_text_sent, auto_text_sent_at")
    .eq("id", missedCallId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAccountForAutoText(
  supabase: AdminClient,
  accountId: string
): Promise<Pick<AccountRow, "id" | "business_name" | "twilio_phone_number">> {
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

export async function getActiveMissedCallTemplate(
  supabase: AdminClient,
  accountId: string
) {
  const { data, error } = await supabase
    .from("templates")
    .select("id, body")
    .eq("account_id", accountId)
    .eq("template_type", "missed_call")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function isPhoneOptedOut(
  supabase: AdminClient,
  accountId: string,
  phoneNumber: string
) {
  const { data, error } = await supabase
    .from("opt_outs")
    .select("id")
    .eq("account_id", accountId)
    .eq("phone_number", phoneNumber)
    .eq("opted_out", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function hasRecentAutoText(
  supabase: AdminClient,
  accountId: string,
  phoneNumber: string,
  sinceIso: string,
  currentMissedCallId: string
) {
  const { data, error } = await supabase
    .from("missed_calls")
    .select("id")
    .eq("account_id", accountId)
    .eq("caller_number", phoneNumber)
    .eq("auto_text_sent", true)
    .gte("auto_text_sent_at", sinceIso)
    .neq("id", currentMissedCallId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function upsertConversationForMissedCall(
  supabase: AdminClient,
  missedCall: Pick<MissedCallRow, "id" | "account_id" | "caller_name" | "caller_number" | "caller_phone">
) {
  const contactPhone = missedCall.caller_number ?? missedCall.caller_phone;
  const { data: existingConversation, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("account_id", missedCall.account_id)
    .eq("contact_phone", contactPhone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingConversation) {
    const { data, error } = await supabase
      .from("conversations")
      .update({
        missed_call_id: missedCall.id,
        contact_name: missedCall.caller_name,
        status: "open",
        updated_at: new Date().toISOString()
      })
      .eq("id", existingConversation.id)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      account_id: missedCall.account_id,
      missed_call_id: missedCall.id,
      contact_name: missedCall.caller_name,
      contact_phone: contactPhone,
      channel: "sms",
      status: "open",
      updated_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function insertOutboundMessage(
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
      direction: "outbound",
      sender_type: "system",
      body: params.body,
      delivery_status: "sent",
      sent_at: params.sentAt
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateConversationPreview(
  supabase: AdminClient,
  params: {
    conversationId: string;
    body: string;
    sentAt: string;
  }
) {
  const { error } = await supabase
    .from("conversations")
    .update({
      latest_message_preview: params.body,
      last_message_at: params.sentAt,
      status: "open",
      updated_at: params.sentAt
    })
    .eq("id", params.conversationId);

  if (error) {
    throw error;
  }
}

export async function markMissedCallAutoTextSent(
  supabase: AdminClient,
  missedCallId: string,
  sentAt: string
) {
  const { error } = await supabase
    .from("missed_calls")
    .update({
      auto_text_sent: true,
      auto_text_sent_at: sentAt,
      recovery_status: "texted"
    })
    .eq("id", missedCallId);

  if (error) {
    throw error;
  }
}
