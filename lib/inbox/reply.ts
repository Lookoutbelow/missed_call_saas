import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getTwilioClient } from "@/lib/twilio/sms";

type AdminClient = SupabaseClient<Database>;

type ReplyResult =
  | {
      ok: true;
      message: {
        id: string;
        body: string;
        direction: "inbound" | "outbound";
        senderType: "customer" | "system" | "team_member";
        sentAt: string;
        deliveryStatus: "queued" | "sent" | "delivered" | "failed" | "received";
      };
      latestMessageAt: string;
      providerSid: string;
    }
  | {
      ok: false;
      error: string;
      message?: {
        id: string;
        body: string;
        direction: "inbound" | "outbound";
        senderType: "customer" | "system" | "team_member";
        sentAt: string;
        deliveryStatus: "queued" | "sent" | "delivered" | "failed" | "received";
      };
    };

export async function sendConversationReply(
  supabase: AdminClient,
  params: {
    accountId: string;
    conversationId: string;
    body: string;
  }
): Promise<ReplyResult> {
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("twilio_phone_number, business_name")
    .eq("id", params.accountId)
    .single();

  if (accountError) {
    throw accountError;
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, contact_phone")
    .eq("account_id", params.accountId)
    .eq("id", params.conversationId)
    .single();

  if (conversationError) {
    throw conversationError;
  }

  const { data: optOut, error: optOutError } = await supabase
    .from("opt_outs")
    .select("id")
    .eq("account_id", params.accountId)
    .eq("phone_number", conversation.contact_phone)
    .eq("opted_out", true)
    .maybeSingle();

  if (optOutError) {
    throw optOutError;
  }

  if (optOut) {
    return {
      ok: false,
      error: "Customer has opted out of SMS."
    };
  }

  if (!account.twilio_phone_number) {
    return {
      ok: false,
      error: `Twilio phone number is not configured for ${account.business_name}.`
    };
  }

  const sentAt = new Date().toISOString();
  const twilioClient = getTwilioClient();

  try {
    const sentMessage = await twilioClient.messages.create({
      to: conversation.contact_phone,
      from: account.twilio_phone_number,
      body: params.body
    });

    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        account_id: params.accountId,
        conversation_id: params.conversationId,
        provider_message_id: sentMessage.sid,
        direction: "outbound",
        sender_type: "team_member",
        body: params.body,
        delivery_status: "sent",
        sent_at: sentAt
      })
      .select("id, body, direction, sender_type, sent_at, delivery_status")
      .single();

    if (messageError) {
      throw messageError;
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        latest_message_preview: params.body,
        last_message_at: sentAt,
        updated_at: sentAt,
        status: "open"
      })
      .eq("id", params.conversationId);

    if (updateError) {
      throw updateError;
    }

    return {
      ok: true,
      message: {
        id: message.id,
        body: message.body,
        direction: message.direction,
        senderType: message.sender_type,
        sentAt: message.sent_at,
        deliveryStatus: message.delivery_status
      },
      latestMessageAt: sentAt,
      providerSid: sentMessage.sid
    };
  } catch (error) {
    const { data: failedMessage, error: failedMessageError } = await supabase
      .from("messages")
      .insert({
        account_id: params.accountId,
        conversation_id: params.conversationId,
        provider_message_id: null,
        direction: "outbound",
        sender_type: "team_member",
        body: params.body,
        delivery_status: "failed",
        sent_at: sentAt
      })
      .select("id, body, direction, sender_type, sent_at, delivery_status")
      .single();

    if (failedMessageError) {
      throw failedMessageError;
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Twilio send failed.",
      message: {
        id: failedMessage.id,
        body: failedMessage.body,
        direction: failedMessage.direction,
        senderType: failedMessage.sender_type,
        sentAt: failedMessage.sent_at,
        deliveryStatus: failedMessage.delivery_status
      }
    };
  }
}
