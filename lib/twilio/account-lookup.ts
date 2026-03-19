import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { normalizePhoneNumber } from "@/lib/twilio/normalize";

type AdminClient = SupabaseClient<Database>;

function escapeFilterValue(value: string) {
  return `"${value.replaceAll('"', '\\"')}"`;
}

export async function findAccountByTwilioNumber(supabase: AdminClient, incomingNumber: string | null) {
  const normalizedNumber = normalizePhoneNumber(incomingNumber ?? undefined);
  if (!normalizedNumber) {
    return null;
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("id, business_name, twilio_phone_number, business_phone")
    .or(
      `twilio_phone_number.eq.${escapeFilterValue(normalizedNumber)},business_phone.eq.${escapeFilterValue(normalizedNumber)}`
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
