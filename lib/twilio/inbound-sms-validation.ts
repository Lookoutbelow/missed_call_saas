import type { TwilioInboundSmsPayload } from "@/lib/twilio/inbound-sms-types";

export function validateInboundSmsPayload(payload: TwilioInboundSmsPayload) {
  const errors: string[] = [];

  if (!payload.From?.trim()) {
    errors.push("From is required.");
  }

  if (!payload.To?.trim()) {
    errors.push("To is required.");
  }

  if (!payload.Body?.trim()) {
    errors.push("Body is required.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
