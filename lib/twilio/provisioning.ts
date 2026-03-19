import { createAdminClient } from "@/lib/supabase/admin";

function normalizeProvisionedNumber(value: string) {
  return value.trim().startsWith("+") ? value.trim() : `+${value.trim()}`;
}

// Internal helper for future admin tooling when Twilio number assignment is automated.
export async function attachTwilioNumberToAccount(accountId: string, twilioPhoneNumber: string) {
  const supabase = createAdminClient();
  const normalizedNumber = normalizeProvisionedNumber(twilioPhoneNumber);

  const { error } = await supabase
    .from("accounts")
    .update({
      twilio_phone_number: normalizedNumber,
      updated_at: new Date().toISOString()
    })
    .eq("id", accountId);

  if (error) {
    throw error;
  }
}
