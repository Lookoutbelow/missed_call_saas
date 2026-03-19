import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { findAccountByTwilioNumber } from "@/lib/twilio/account-lookup";
import { MISSED_CALL_CANDIDATE_STATUSES } from "@/lib/twilio/constants";
import { getDirection, normalizePhoneNumber, parseCallTime } from "@/lib/twilio/normalize";
import type { MissedCallProcessingResult, TwilioVoiceWebhookPayload } from "@/lib/twilio/types";

type AdminClient = SupabaseClient<Database>;

function getAccountLookupNumbers(calledNumber: string | null) {
  if (!calledNumber) {
    return [];
  }

  return [calledNumber];
}

export async function processMissedCallCandidate(
  supabase: AdminClient,
  payload: TwilioVoiceWebhookPayload
): Promise<MissedCallProcessingResult> {
  const direction = getDirection(payload);
  const callStatus = (payload.CallStatus ?? "").trim().toLowerCase();
  const callSid = payload.CallSid?.trim();

  if (!callSid) {
    return { ok: true, processed: false, reason: "missing_call_sid" };
  }

  if (!direction.includes("inbound")) {
    return { ok: true, processed: false, reason: "not_inbound", callSid, callStatus, direction };
  }

  if (!MISSED_CALL_CANDIDATE_STATUSES.has(callStatus)) {
    return { ok: true, processed: false, reason: "not_missed_status", callSid, callStatus, direction };
  }

  const callerNumber = normalizePhoneNumber(payload.From ?? payload.Caller);
  const calledNumber = normalizePhoneNumber(payload.To ?? payload.Called);
  const lookupNumbers = getAccountLookupNumbers(calledNumber);

  const accountFilter = lookupNumbers[0];
  if (!accountFilter) {
    return { ok: true, processed: false, reason: "account_not_found", callSid, callStatus, direction };
  }

  const account = await findAccountByTwilioNumber(supabase, accountFilter);

  if (!account) {
    return { ok: true, processed: false, reason: "account_not_found", callSid, callStatus, direction };
  }

  const callTime = parseCallTime(payload);
  const durationSeconds = Number.parseInt(payload.CallDuration ?? "0", 10);
  const { data: existingRecord, error: existingRecordError } = await supabase
    .from("missed_calls")
    .select("id")
    .eq("call_sid", callSid)
    .maybeSingle();

  if (existingRecordError) {
    throw existingRecordError;
  }

  const upsertPayload: Database["public"]["Tables"]["missed_calls"]["Insert"] = {
    account_id: account.id,
    provider_call_id: callSid,
    call_sid: callSid,
    caller_phone: callerNumber ?? payload.From ?? payload.Caller ?? "unknown",
    destination_phone: calledNumber,
    caller_number: callerNumber,
    called_number: calledNumber,
    direction,
    call_time: callTime,
    call_started_at: callTime,
    duration_seconds: Number.isNaN(durationSeconds) ? 0 : durationSeconds,
    call_status: callStatus as Database["public"]["Tables"]["missed_calls"]["Row"]["call_status"],
    recovery_status: "pending",
    raw_event: payload
  };

  const { data, error } = await supabase
    .from("missed_calls")
    .upsert(upsertPayload, {
      onConflict: "call_sid"
    })
    .select("id, call_sid")
    .single();

  if (error) {
    throw error;
  }

  return {
    ok: true,
    processed: true,
    reason: existingRecord ? "updated" : "stored",
    accountId: account.id,
    missedCallId: data.id,
    callSid,
    callStatus,
    direction
  };
}
