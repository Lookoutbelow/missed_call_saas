import type { TwilioVoiceWebhookPayload } from "@/lib/twilio/types";
import { getDirection } from "@/lib/twilio/normalize";

export function validateVoicePayload(payload: TwilioVoiceWebhookPayload) {
  const errors: string[] = [];

  if (!payload.CallSid?.trim()) {
    errors.push("CallSid is required.");
  }

  if (!payload.CallStatus?.trim()) {
    errors.push("CallStatus is required.");
  }

  if (!payload.To?.trim() && !payload.Called?.trim()) {
    errors.push("To or Called is required.");
  }

  if (!payload.From?.trim() && !payload.Caller?.trim()) {
    errors.push("From or Caller is required.");
  }

  const direction = getDirection(payload);
  if (!direction) {
    errors.push("Direction is required.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
