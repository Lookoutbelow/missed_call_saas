import { NextRequest, NextResponse } from "next/server";

import { captureError } from "@/lib/monitoring";
import { createAdminClient } from "@/lib/supabase/admin";
import { processInboundSms } from "@/lib/twilio/inbound-sms";
import type { TwilioInboundSmsPayload } from "@/lib/twilio/inbound-sms-types";
import { validateInboundSmsPayload } from "@/lib/twilio/inbound-sms-validation";
import { verifyTwilioRequest } from "@/lib/twilio/verify";
import { finalizeWebhookReceipt, recordWebhookReceipt } from "@/lib/webhooks/audit";
import { getRequestIp } from "@/lib/webhooks/request";
import { checkWebhookRateLimit } from "@/lib/webhooks/rate-limit";

export const runtime = "nodejs";

function getWebhookUrl(request: NextRequest) {
  return request.nextUrl.toString();
}

function toPayload(formData: FormData): TwilioInboundSmsPayload {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)])
  ) as TwilioInboundSmsPayload;
}

function xmlResponse(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8"
    }
  });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  let auditId: string | null = null;

  try {
    const rateLimit = checkWebhookRateLimit(`twilio-sms:${getRequestIp(request)}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ ok: false, processed: false, reason: "rate_limited" }, { status: 429 });
    }

    const formData = await request.formData();
    const payload = toPayload(formData);
    const params = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
    const signature = request.headers.get("x-twilio-signature");
    const receipt = await recordWebhookReceipt(supabase, {
      source: "twilio_inbound_sms",
      providerEventId: payload.MessageSid?.trim() ?? payload.SmsSid?.trim() ?? null,
      eventType: "inbound_sms",
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
      return new NextResponse(null, { status: 204 });
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

    const validation = validateInboundSmsPayload(payload);
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

    const result = await processInboundSms(supabase, payload);
    await finalizeWebhookReceipt(supabase, receipt.id, {
      processingStatus: result.processed ? "processed" : "skipped",
      errorMessage: null
    });

    if (result.ok && result.processed && (result.reason === "opt_out_added" || result.reason === "opt_out_removed")) {
      return xmlResponse("<Response></Response>");
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    await captureError(error, {
      route: "/api/twilio/inbound-sms"
    });
    if (auditId) {
      try {
        await finalizeWebhookReceipt(supabase, auditId, {
          processingStatus: "failed",
          errorMessage: error instanceof Error ? error.message : "Unhandled webhook error."
        });
      } catch (finalizeError) {
        await captureError(finalizeError, {
          route: "/api/twilio/inbound-sms",
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
