export type TwilioVoiceWebhookPayload = {
  AccountSid?: string;
  ApiVersion?: string;
  CallSid?: string;
  CallStatus?: string;
  CallDuration?: string;
  Called?: string;
  Caller?: string;
  Direction?: string;
  From?: string;
  To?: string;
  Timestamp?: string;
  CallTime?: string;
};

export type MissedCallProcessingResult =
  | {
      ok: true;
      processed: boolean;
      reason:
        | "stored"
        | "updated"
        | "not_inbound"
        | "not_missed_status"
        | "account_not_found"
        | "missing_call_sid";
      accountId?: string;
      missedCallId?: string;
      callSid?: string;
      callStatus?: string;
      direction?: string;
    }
  | {
      ok: false;
      processed: false;
      reason: "invalid_payload" | "invalid_signature" | "server_error";
      errors?: string[];
    };

export type AutoTextResult =
  | {
      ok: true;
      sent: boolean;
      reason:
        | "sent"
        | "opted_out"
        | "already_sent_for_call"
        | "recent_auto_text"
        | "template_not_found"
        | "missing_phone_number";
      messageSid?: string;
      conversationId?: string;
      messageId?: string;
    }
  | {
      ok: false;
      sent: false;
      reason: "twilio_send_failed" | "server_error";
      error?: string;
    };
