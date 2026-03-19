import { sendLeadReplyEmailNotification } from "@/lib/notifications/email";
import { sendLeadReplySmsNotification } from "@/lib/notifications/sms";
import type { LeadReplyNotificationPayload, LeadReplyNotificationResult } from "@/lib/notifications/types";
import {
  countInboundCustomerMessages,
  createNotificationEvent,
  getAccountNotificationContext,
  getConversationNotificationContext,
  getMissedCallAutoTextState,
  getNotificationSettings,
  hasRecentNotificationEvent
} from "@/lib/notifications/repository";
import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient<Database>;

const EVENT_TYPE = "first_inbound_lead_reply";

function subMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

export async function notifyOnFirstInboundLeadReply(
  supabase: AdminClient,
  conversationId: string
): Promise<LeadReplyNotificationResult> {
  const conversation = await getConversationNotificationContext(supabase, conversationId);
  if (!conversation.missed_call_id) {
    return { notified: false, channels: [], skippedReason: "not_first_inbound_after_auto_text" };
  }

  const missedCall = await getMissedCallAutoTextState(supabase, conversation.missed_call_id);
  if (!missedCall?.auto_text_sent || !missedCall.auto_text_sent_at) {
    return { notified: false, channels: [], skippedReason: "not_first_inbound_after_auto_text" };
  }

  const inboundCount = await countInboundCustomerMessages(supabase, conversation.id);
  if (inboundCount !== 1) {
    return { notified: false, channels: [], skippedReason: "not_first_inbound_after_auto_text" };
  }

  const tenMinutesAgo = subMinutes(new Date(), 10).toISOString();
  const hasRecentEvent = await hasRecentNotificationEvent(supabase, {
    conversationId: conversation.id,
    eventType: EVENT_TYPE,
    sinceIso: tenMinutesAgo
  });

  if (hasRecentEvent) {
    return { notified: false, channels: [], skippedReason: "notification_recently_sent" };
  }

  const settings = await getNotificationSettings(supabase, conversation.account_id);
  if (!settings) {
    return { notified: false, channels: [], skippedReason: "settings_not_found" };
  }

  const account = await getAccountNotificationContext(supabase, conversation.account_id);
  const payload: LeadReplyNotificationPayload = {
    accountId: conversation.account_id,
    businessName: account.business_name,
    conversationId: conversation.id,
    customerPhone: conversation.contact_phone,
    latestMessage: conversation.latest_message_preview ?? "",
    timestamp: conversation.last_message_at ?? new Date().toISOString()
  };

  const channels: Array<"email" | "sms"> = [];

  if (settings.missed_call_email_enabled && settings.notification_emails.length > 0) {
    const emailSent = await sendLeadReplyEmailNotification(payload, settings.notification_emails);
    if (emailSent) {
      channels.push("email");
    }
  }

  if (settings.missed_call_sms_enabled && settings.escalation_phone) {
    const smsSent = await sendLeadReplySmsNotification(
      payload,
      account.twilio_phone_number,
      settings.escalation_phone
    );
    if (smsSent) {
      channels.push("sms");
    }
  }

  if (channels.length === 0) {
    return { notified: false, channels: [], skippedReason: "no_destinations" };
  }

  await createNotificationEvent(supabase, {
    accountId: conversation.account_id,
    conversationId: conversation.id,
    eventType: EVENT_TYPE,
    sentChannels: channels,
    payload
  });

  return {
    notified: true,
    channels
  };
}
