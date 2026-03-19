import type { TwilioVoiceWebhookPayload } from "@/lib/twilio/types";

export function normalizePhoneNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/^\+/, "")}`;
}

export function parseCallTime(payload: TwilioVoiceWebhookPayload) {
  const candidate = payload.CallTime ?? payload.Timestamp;
  if (!candidate) {
    return new Date().toISOString();
  }

  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function getDirection(payload: TwilioVoiceWebhookPayload) {
  return (payload.Direction ?? "").trim().toLowerCase();
}
