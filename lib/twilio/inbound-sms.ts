import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { notifyOnFirstInboundLeadReply } from "@/lib/notifications/lead-reply";
import { findAccountByTwilioNumber } from "@/lib/twilio/account-lookup";
import {
  createConversation,
  createLeadFromInboundSms,
  findConversationByCustomerPhone,
  findLeadByCustomerPhone,
  findMessageByProviderSid,
  insertInboundMessage,
  setOptOutStatus,
  touchLeadFromInboundSms,
  updateConversationFromInboundMessage
} from "@/lib/twilio/inbound-sms-repository";
import { parseIssueType, parseUrgency, getSmsKeywordIntent } from "@/lib/twilio/inbound-sms-parser";
import { normalizePhoneNumber } from "@/lib/twilio/normalize";
import type { InboundSmsResult, TwilioInboundSmsPayload } from "@/lib/twilio/inbound-sms-types";

type AdminClient = SupabaseClient<Database>;

export async function processInboundSms(
  supabase: AdminClient,
  payload: TwilioInboundSmsPayload
): Promise<InboundSmsResult> {
  const customerNumber = normalizePhoneNumber(payload.From);
  const twilioNumber = normalizePhoneNumber(payload.To);
  const body = payload.Body?.trim() ?? "";
  const providerMessageId = payload.MessageSid?.trim() ?? payload.SmsSid?.trim() ?? "";

  if (!customerNumber || !twilioNumber) {
    return { ok: true, processed: false, reason: "missing_numbers" };
  }

  const account = await findAccountByTwilioNumber(supabase, twilioNumber);
  if (!account) {
    return { ok: true, processed: false, reason: "account_not_found" };
  }

  const intent = getSmsKeywordIntent(body);
  if (intent === "stop") {
    await setOptOutStatus(supabase, {
      accountId: account.id,
      phoneNumber: customerNumber,
      optedOut: true
    });
    return { ok: true, processed: true, reason: "opt_out_added", accountId: account.id };
  }

  if (intent === "start") {
    await setOptOutStatus(supabase, {
      accountId: account.id,
      phoneNumber: customerNumber,
      optedOut: false
    });
    return { ok: true, processed: true, reason: "opt_out_removed", accountId: account.id };
  }

  if (providerMessageId) {
    const existingMessage = await findMessageByProviderSid(supabase, providerMessageId);
    if (existingMessage) {
      return { ok: true, processed: false, reason: "duplicate_message", accountId: account.id };
    }
  }

  const at = new Date().toISOString();
  const existingConversation = await findConversationByCustomerPhone(supabase, account.id, customerNumber);
  const conversation = existingConversation
    ? existingConversation
    : await createConversation(supabase, {
        accountId: account.id,
        customerPhone: customerNumber,
        at
      });

  const message = await insertInboundMessage(supabase, {
    accountId: account.id,
    conversationId: conversation.id,
    body,
    providerMessageId: providerMessageId || `inbound-${account.id}-${Date.now()}`,
    sentAt: at
  });

  await updateConversationFromInboundMessage(supabase, {
    conversationId: conversation.id,
    body,
    at
  });

  const issueType = parseIssueType(body);
  const urgency = parseUrgency(body);
  const existingLead = await findLeadByCustomerPhone(supabase, account.id, customerNumber);
  let notification:
    | {
        notified: boolean;
        channels: Array<"email" | "sms">;
        skippedReason?: string;
      }
    | undefined;

  try {
    notification = await notifyOnFirstInboundLeadReply(supabase, conversation.id);
  } catch (error) {
    console.error("Lead reply notification error", error);
    notification = {
      notified: false,
      channels: [],
      skippedReason: "delivery_failed"
    };
  }

  if (existingLead) {
    await touchLeadFromInboundSms(supabase, {
      leadId: existingLead.id,
      issueType,
      urgency,
      at
    });

    return {
      ok: true,
      processed: true,
      reason: "stored",
      accountId: account.id,
      conversationId: conversation.id,
      leadId: existingLead.id,
      messageId: message.id,
      notification,
      issueType,
      urgency
    };
  }

  const lead = await createLeadFromInboundSms(supabase, {
    accountId: account.id,
    conversationId: conversation.id,
    customerPhone: customerNumber,
    serviceCategory: issueType ?? "general_inquiry",
    issueType,
    urgency,
    at
  });

  return {
    ok: true,
    processed: true,
    reason: "stored",
    accountId: account.id,
    conversationId: conversation.id,
    leadId: lead.id,
    messageId: message.id,
    notification,
    issueType,
    urgency
  };
}
