import { NextRequest, NextResponse } from "next/server";

import { captureError } from "@/lib/monitoring";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMissedCallAutoReply } from "@/lib/twilio/auto-text";
import { processMissedCallCandidate } from "@/lib/twilio/missed-calls";
import type { TwilioVoiceWebhookPayload } from "@/lib/twilio/types";
import { validateVoicePayload } from "@/lib/twilio/validation";
import { verifyTwilioRequest } from "@/lib/twilio/verify";
import { finalizeWebhookReceipt, recordWebhookReceipt } from "@/lib/webhooks/audit";
import { getRequestIp } from "@/lib/webhooks/request";
import { checkWebhookRateLimit } from "@/lib/webhooks/rate-limit";

export const runtime = "nodejs";

function getWebhookUrl(request: NextRequest) {
  return request.nextUrl.toString();
}

function toPayload(formData: FormData): TwilioVoiceWebhookPayload {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)])
  ) as TwilioVoiceWebhookPayload;
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  let auditId: string | null = null;

  try {
    const rateLimit = checkWebhookRateLimit(`twilio-voice:${getRequestIp(request)}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ ok: false, processed: false, reason: "rate_limited" }, { status: 429 });
    }

    const formData = await request.formData();
    const payload = toPayload(formData);
    const params = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
    const signature = request.headers.get("x-twilio-signature");
    const receipt = await recordWebhookReceipt(supabase, {
      source: "twilio_voice_status",
      providerEventId: payload.CallSid?.trim() ?? null,
      eventType: (payload.CallStatus ?? "unknown").trim().toLowerCase(),
      requestSignature: signature,
      requestIp: getRequestIp(request),
      payload
    });
    auditId = receipt.id;

    if (receipt.isDuplicate) {
      await finalizeWebhookReceipt(supabase, receipt.id, {
        processingStatus: "skipped",
        errorMessage: "Duplicate webhook delivery skipped."
      });
      return NextResponse.json({ ok: true, processed: false, reason: "duplicate_event" }, { status: 200 });
    }

    if (!verifyTwilioRequest(signature, getWebhookUrl(request), params)) {
      await finalizeWebhookReceipt(supabase, receipt.id, {
        processingStatus: "failed",
        errorMessage: "Invalid Twilio signature."
      });
      return NextResponse.json(
        {
          ok: false,
          processed: false,
          reason: "invalid_signature"
        },
        { status: 401 }
      );
    }

    const validation = validateVoicePayload(payload);
    if (!validation.isValid) {
      await finalizeWebhookReceipt(supabase, receipt.id, {
        processingStatus: "failed",
        errorMessage: validation.errors.join(" ")
      });
      return NextResponse.json(
        {
          ok: false,
          processed: false,
          reason: "invalid_payload",
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    const result = await processMissedCallCandidate(supabase, payload);

    const autoReply =
      result.ok && result.processed && result.missedCallId
        ? await sendMissedCallAutoReply(supabase, result.missedCallId)
        : null;

    await finalizeWebhookReceipt(supabase, receipt.id, {
      processingStatus: result.processed ? "processed" : "skipped",
      errorMessage: null
    });

    return NextResponse.json(
      {
        ...result,
        autoReply
      },
      { status: 200 }
    );
  } catch (error) {
    await captureError(error, {
      route: "/api/twilio/voice-status"
    });
    if (auditId) {
      try {
        await finalizeWebhookReceipt(supabase, auditId, {
          processingStatus: "failed",
          errorMessage: error instanceof Error ? error.message : "Unhandled webhook error."
        });
      } catch (finalizeError) {
        await captureError(finalizeError, {
          route: "/api/twilio/voice-status",
          phase: "finalize-audit"
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        processed: false,
        reason: "server_error"
      },
      { status: 500 }
    );
  }
}
