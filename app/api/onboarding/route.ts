import { NextRequest, NextResponse } from "next/server";

import { getCurrentAccount, getCurrentUser } from "@/lib/account";
import { DEFAULT_OFFICE_HOURS, DEFAULT_TEMPLATES } from "@/lib/onboarding/defaults";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type OnboardingPayload = {
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  timezone?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^[0-9+()\-\s]{7,}$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const [user, existingAccount] = await Promise.all([getCurrentUser(), getCurrentAccount()]);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (existingAccount) {
      return NextResponse.json({ error: "Account already exists." }, { status: 409 });
    }

    const payload = (await request.json()) as OnboardingPayload;
    const businessName = payload.businessName?.trim() ?? "";
    const ownerName = payload.ownerName?.trim() ?? "";
    const email = payload.email?.trim() ?? "";
    const phone = payload.phone?.trim() ?? "";
    const timezone = payload.timezone?.trim() || "America/New_York";

    if (!businessName || !ownerName) {
      return NextResponse.json({ error: "Business and owner name are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const baseSlug = slugify(businessName) || "plumbing-shop";
    let slug = baseSlug;
    let attempt = 1;

    while (true) {
      const { data: existingSlugAccount, error: slugLookupError } = await supabase
        .from("accounts")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugLookupError) {
        throw slugLookupError;
      }

      if (!existingSlugAccount) {
        break;
      }

      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const accountsQuery = supabase.from("accounts") as any;
    const { data: account, error: accountError } = await accountsQuery
      .insert({
        owner_user_id: user.id,
        business_name: businessName,
        owner_name: ownerName,
        email,
        business_phone: phone,
        timezone,
        slug,
        office_hours_json: DEFAULT_OFFICE_HOURS
      })
      .select("id")
      .single();

    if (accountError) {
      throw accountError;
    }

    const accountId = account.id as string;

    try {
      const notificationSettingsQuery = supabase.from("notification_settings") as any;
      const { error: notificationsError } = await notificationSettingsQuery.insert({
        account_id: accountId,
        notify_email: email,
        notify_sms_number: phone,
        notification_emails: [email],
        escalation_phone: phone
      });

      if (notificationsError) {
        throw notificationsError;
      }

      const templatesQuery = supabase.from("templates") as any;
      const { error: templatesError } = await templatesQuery.insert(
        DEFAULT_TEMPLATES.map((template) => ({
          account_id: accountId,
          name: template.name,
          template_type: template.template_type,
          body: template.body,
          is_active: true
        }))
      );

      if (templatesError) {
        throw templatesError;
      }
    } catch (error) {
      const deleteAccountsQuery = supabase.from("accounts") as any;
      await deleteAccountsQuery.delete().eq("id", accountId);
      throw error;
    }

    return NextResponse.json(
      {
        ok: true,
        accountId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Onboarding error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to complete onboarding."
      },
      { status: 500 }
    );
  }
}
