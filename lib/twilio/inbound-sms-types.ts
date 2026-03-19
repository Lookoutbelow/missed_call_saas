export type TwilioInboundSmsPayload = {
  AccountSid?: string;
  ApiVersion?: string;
  Body?: string;
  From?: string;
  To?: string;
  MessageSid?: string;
  SmsSid?: string;
  NumMedia?: string;
};

export type InboundSmsResult =
  | {
      ok: true;
      processed: boolean;
      reason:
        | "stored"
        | "opt_out_added"
        | "opt_out_removed"
        | "account_not_found"
        | "missing_numbers"
        | "duplicate_message";
      accountId?: string;
      conversationId?: string;
      leadId?: string;
      messageId?: string;
      notification?: {
        notified: boolean;
        channels: Array<"email" | "sms">;
        skippedReason?: string;
      };
      issueType?: string | null;
      urgency?: "emergency" | "same_day" | "standard" | null;
    }
  | {
      ok: false;
      processed: false;
      reason: "invalid_signature" | "invalid_payload" | "server_error";
      errors?: string[];
    };
