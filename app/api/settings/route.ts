import { NextRequest, NextResponse } from "next/server";

import { getCurrentAccount, getCurrentUser } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OfficeHoursJson, SettingsPayload } from "@/lib/settings/types";

export const runtime = "nodejs";

const REQUIRED_TEMPLATE_TYPES = [
  { key: "missedCall", templateType: "missed_call", name: "Missed call template" },
  { key: "afterHours", templateType: "after_hours", name: "After-hours template" },
  { key: "optOutConfirmation", templateType: "opt_out_confirmation", name: "Opt-out confirmation template" }
] as const;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^[0-9+()\-\s]{7,}$/.test(value);
}

function isValidOfficeHours(officeHours: OfficeHoursJson) {
  return Object.values(officeHours).every((entry) => {
    if (!entry.isOpen) {
      return true;
    }

    return Boolean(entry.open) && Boolean(entry.close) && entry.open < entry.close;
  });
}

export async function POST(request: NextRequest) {
  try {
    const [user, account] = await Promise.all([getCurrentUser(), getCurrentAccount()]);
    if (!user || !account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as SettingsPayload;
    const { businessInfo, officeHours, templates, notifications } = payload;

    if (!businessInfo.businessName.trim() || !businessInfo.ownerName.trim()) {
      return NextResponse.json({ error: "Business and owner name are required." }, { status: 400 });
    }

    if (!isValidEmail(businessInfo.email.trim())) {
      return NextResponse.json({ error: "A valid business email is required." }, { status: 400 });
    }

    if (!isValidPhone(businessInfo.phone.trim())) {
      return NextResponse.json({ error: "A valid business phone is required." }, { status: 400 });
    }

    if (notifications.notifyEmail.trim() && !isValidEmail(notifications.notifyEmail.trim())) {
      return NextResponse.json({ error: "Notify email is invalid." }, { status: 400 });
    }

    if (notifications.notifySmsNumber.trim() && !isValidPhone(notifications.notifySmsNumber.trim())) {
      return NextResponse.json({ error: "Notify SMS number is invalid." }, { status: 400 });
    }

    if (!isValidOfficeHours(officeHours)) {
      return NextResponse.json({ error: "Office hours contain invalid open/close times." }, { status: 400 });
    }

    for (const templateDefinition of REQUIRED_TEMPLATE_TYPES) {
      const value = templates[templateDefinition.key];
      if (!value.trim()) {
        return NextResponse.json({ error: `${templateDefinition.name} is required.` }, { status: 400 });
      }
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const accountsQuery = supabase.from("accounts") as any;
    const { error: accountError } = await accountsQuery
      .update({
        business_name: businessInfo.businessName.trim(),
        owner_name: businessInfo.ownerName.trim(),
        email: businessInfo.email.trim(),
        business_phone: businessInfo.phone.trim(),
        timezone: businessInfo.timezone,
        office_hours_json: officeHours,
        updated_at: now
      })
      .eq("id", account.id);

    if (accountError) {
      throw accountError;
    }

    const notificationSettingsQuery = supabase.from("notification_settings") as any;
    const { error: notificationError } = await notificationSettingsQuery.upsert(
      {
        account_id: account.id,
        notify_email: notifications.notifyEmail.trim() || null,
        notify_sms_number: notifications.notifySmsNumber.trim() || null,
        notification_emails: notifications.notifyEmail.trim() ? [notifications.notifyEmail.trim()] : [],
        escalation_phone: notifications.notifySmsNumber.trim() || null,
        updated_at: now
      },
      { onConflict: "account_id" }
    );

    if (notificationError) {
      throw notificationError;
    }

    for (const templateDefinition of REQUIRED_TEMPLATE_TYPES) {
      const templateValue = templates[templateDefinition.key].trim();
      const templatesQuery = supabase.from("templates") as any;

      const { data: existingTemplate, error: templateLookupError } = await templatesQuery
        .select("id")
        .eq("account_id", account.id)
        .eq("template_type", templateDefinition.templateType)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (templateLookupError) {
        throw templateLookupError;
      }

      if (existingTemplate) {
        const { error: updateTemplateError } = await templatesQuery
          .update({
            name: templateDefinition.name,
            body: templateValue,
            is_active: true
          })
          .eq("id", existingTemplate.id);

        if (updateTemplateError) {
          throw updateTemplateError;
        }
      } else {
        const { error: insertTemplateError } = await templatesQuery.insert({
          account_id: account.id,
          name: templateDefinition.name,
          template_type: templateDefinition.templateType,
          body: templateValue,
          is_active: true
        });

        if (insertTemplateError) {
          throw insertTemplateError;
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Settings save error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save settings."
      },
      { status: 500 }
    );
  }
}
