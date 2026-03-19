import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
type CurrentAccount = Pick<
  AccountRow,
  | "id"
  | "business_name"
  | "owner_name"
  | "email"
  | "business_phone"
  | "timezone"
  | "twilio_phone_number"
  | "plan_tier"
  | "office_hours_json"
>;

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user ?? null;
}

export async function getCurrentAccount(): Promise<CurrentAccount | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("id, business_name, owner_name, email, business_phone, timezone, twilio_phone_number, plan_tier, office_hours_json")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CurrentAccount | null;
}
