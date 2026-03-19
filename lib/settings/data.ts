import { createClient } from "@/lib/supabase/server";

import type { OfficeHoursJson, SettingsPayload } from "@/lib/settings/types";

const DEFAULT_OFFICE_HOURS: OfficeHoursJson = {
  monday: { isOpen: true, open: "08:00", close: "17:00" },
  tuesday: { isOpen: true, open: "08:00", close: "17:00" },
  wednesday: { isOpen: true, open: "08:00", close: "17:00" },
  thursday: { isOpen: true, open: "08:00", close: "17:00" },
  friday: { isOpen: true, open: "08:00", close: "17:00" },
  saturday: { isOpen: false, open: "09:00", close: "13:00" },
  sunday: { isOpen: false, open: "09:00", close: "13:00" }
};

function mergeOfficeHours(value: unknown): OfficeHoursJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_OFFICE_HOURS;
  }

  const candidate = value as Partial<OfficeHoursJson>;

  return {
    monday: candidate.monday ?? DEFAULT_OFFICE_HOURS.monday,
    tuesday: candidate.tuesday ?? DEFAULT_OFFICE_HOURS.tuesday,
    wednesday: candidate.wednesday ?? DEFAULT_OFFICE_HOURS.wednesday,
    thursday: candidate.thursday ?? DEFAULT_OFFICE_HOURS.thursday,
    friday: candidate.friday ?? DEFAULT_OFFICE_HOURS.friday,
    saturday: candidate.saturday ?? DEFAULT_OFFICE_HOURS.saturday,
    sunday: candidate.sunday ?? DEFAULT_OFFICE_HOURS.sunday
  };
}

export async function getSettingsData(accountId: string): Promise<SettingsPayload> {
  const supabase = await createClient();

  const [{ data: account, error: accountError }, { data: notificationSettings, error: notificationError }, { data: templates, error: templatesError }] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("business_name, owner_name, email, business_phone, timezone, plan_tier, office_hours_json")
        .eq("id", accountId)
        .single(),
      supabase
        .from("notification_settings")
        .select("notify_email, notify_sms_number")
        .eq("account_id", accountId)
        .maybeSingle(),
      supabase
        .from("templates")
        .select("template_type, body")
        .eq("account_id", accountId)
        .eq("is_active", true)
        .in("template_type", ["missed_call", "after_hours", "opt_out_confirmation"])
    ]);

  if (accountError) {
    throw accountError;
  }
  if (notificationError) {
    throw notificationError;
  }
  if (templatesError) {
    throw templatesError;
  }

  const templateMap = new Map(templates.map((template) => [template.template_type, template.body]));

  return {
    businessInfo: {
      businessName: account.business_name,
      ownerName: account.owner_name ?? "",
      email: account.email ?? "",
      phone: account.business_phone ?? "",
      timezone: account.timezone
    },
    officeHours: mergeOfficeHours(account.office_hours_json),
    templates: {
      missedCall: templateMap.get("missed_call") ?? "",
      afterHours: templateMap.get("after_hours") ?? "",
      optOutConfirmation: templateMap.get("opt_out_confirmation") ?? ""
    },
    notifications: {
      notifyEmail: notificationSettings?.notify_email ?? "",
      notifySmsNumber: notificationSettings?.notify_sms_number ?? ""
    },
    plan: {
      name: account.plan_tier,
      usageSummary: "Usage summary coming soon."
    }
  };
}
