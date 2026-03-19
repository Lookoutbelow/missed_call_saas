import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/database.types";

type AdminClient = SupabaseClient<Database>;

type StartArgs = {
  source: string;
  providerEventId: string | null;
  eventType: string;
  requestSignature: string | null;
  requestIp: string | null;
  payload: Json;
};

export async function recordWebhookReceipt(supabase: AdminClient, args: StartArgs) {
  if (args.providerEventId) {
    const { data: existing, error: existingError } = await supabase
      .from("webhook_events")
      .select("id, processing_status")
      .eq("source", args.source)
      .eq("provider_event_id", args.providerEventId)
      .eq("event_type", args.eventType)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return {
        id: existing.id,
        isDuplicate: existing.processing_status === "processed" || existing.processing_status === "skipped"
      };
    }
  }

  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      source: args.source,
      provider_event_id: args.providerEventId,
      event_type: args.eventType,
      processing_status: "received",
      request_signature: args.requestSignature,
      request_ip: args.requestIp,
      payload: args.payload
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505" && args.providerEventId) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("webhook_events")
        .select("id, processing_status")
        .eq("source", args.source)
        .eq("provider_event_id", args.providerEventId)
        .eq("event_type", args.eventType)
        .single();

      if (duplicateError) {
        throw duplicateError;
      }

      return {
        id: duplicate.id,
        isDuplicate: duplicate.processing_status === "processed" || duplicate.processing_status === "skipped"
      };
    }

    throw error;
  }

  return {
    id: data.id,
    isDuplicate: false
  };
}

export async function finalizeWebhookReceipt(
  supabase: AdminClient,
  id: string,
  params: {
    processingStatus: "processed" | "skipped" | "failed";
    errorMessage?: string | null;
  }
) {
  const { error } = await supabase
    .from("webhook_events")
    .update({
      processing_status: params.processingStatus,
      error_message: params.errorMessage ?? null,
      processed_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}
