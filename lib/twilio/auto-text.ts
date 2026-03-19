import { subHours } from "@/lib/twilio/date";
import {
  getAccountForAutoText,
  getActiveMissedCallTemplate,
  getMissedCallForAutoText,
  hasRecentAutoText,
  insertOutboundMessage,
  isPhoneOptedOut,
  markMissedCallAutoTextSent,
  updateConversationPreview,
  upsertConversationForMissedCall
} from "@/lib/twilio/auto-text-repository";
import { normalizePhoneNumber } from "@/lib/twilio/normalize";
import { getTwilioClient } from "@/lib/twilio/sms";
import { DEFAULT_MISSED_CALL_TEMPLATE, renderTemplate } from "@/lib/twilio/templates";
import type { AutoTextResult } from "@/lib/twilio/types";
import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient<Database>;

export async function sendMissedCallAutoReply(
  supabase: AdminClient,
  missedCallId: string
): Promise<AutoTextResult> {
  const missedCall = await getMissedCallForAutoText(supabase, missedCallId);

  if (missedCall.auto_text_sent) {
    return { ok: true, sent: false, reason: "already_sent_for_call" };
  }

  const recipientNumber = normalizePhoneNumber(missedCall.caller_number ?? missedCall.caller_phone);
  if (!recipientNumber) {
    return { ok: true, sent: false, reason: "missing_phone_number" };
  }

  if (await isPhoneOptedOut(supabase, missedCall.account_id, recipientNumber)) {
    return { ok: true, sent: false, reason: "opted_out" };
  }

  const recentThreshold = subHours(new Date(), 4).toISOString();
  if (await hasRecentAutoText(supabase, missedCall.account_id, recipientNumber, recentThreshold, missedCall.id)) {
    return { ok: true, sent: false, reason: "recent_auto_text" };
  }

  const account = await getAccountForAutoText(supabase, missedCall.account_id);
  const template = await getActiveMissedCallTemplate(supabase, missedCall.account_id);
  const templateBody = template?.body ?? DEFAULT_MISSED_CALL_TEMPLATE;
  const sendingNumber = normalizePhoneNumber(account.twilio_phone_number);
  if (!sendingNumber) {
    return { ok: false, sent: false, reason: "server_error", error: "Account Twilio phone number is missing." };
  }

  const body =
    renderTemplate(templateBody, {
      business_name: account.business_name
    }).trim() ||
    renderTemplate(DEFAULT_MISSED_CALL_TEMPLATE, {
      business_name: account.business_name
    }).trim();

  const twilioClient = getTwilioClient();

  try {
    const sentMessage = await twilioClient.messages.create({
      to: recipientNumber,
      from: sendingNumber,
      body
    });

    const sentAt = new Date().toISOString();
    const conversation = await upsertConversationForMissedCall(supabase, missedCall);
    const message = await insertOutboundMessage(supabase, {
      accountId: missedCall.account_id,
      conversationId: conversation.id,
      body,
      providerMessageId: sentMessage.sid,
      sentAt
    });

    await updateConversationPreview(supabase, {
      conversationId: conversation.id,
      body,
      sentAt
    });

    await markMissedCallAutoTextSent(supabase, missedCall.id, sentAt);

    return {
      ok: true,
      sent: true,
      reason: "sent",
      messageSid: sentMessage.sid,
      conversationId: conversation.id,
      messageId: message.id
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Twilio SMS error.";
    return {
      ok: false,
      sent: false,
      reason: "twilio_send_failed",
      error: message
    };
  }
}
