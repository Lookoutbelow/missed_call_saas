import { NextRequest, NextResponse } from "next/server";

import { getCurrentAccount, getCurrentUser } from "@/lib/account";
import type { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type UpdateLeadBody = {
  leadId?: string;
  customerName?: string;
  issueType?: string | null;
  address?: string | null;
  urgency?: "emergency" | "same_day" | "standard";
  callbackPreference?: string | null;
  status?: "new" | "contacted" | "booked" | "closed-lost";
  notes?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const [user, account] = await Promise.all([getCurrentUser(), getCurrentAccount()]);

    if (!user || !account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as UpdateLeadBody;
    const leadId = payload.leadId?.trim();

    if (!leadId || !payload.customerName?.trim() || !payload.urgency || !payload.status) {
      return NextResponse.json({ error: "Missing required lead fields." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const leadUpdate: Database["public"]["Tables"]["leads"]["Update"] = {
      customer_name: payload.customerName.trim(),
      issue_type: payload.issueType?.trim() || null,
      address: payload.address?.trim() || null,
      urgency: payload.urgency,
      callback_preference: payload.callbackPreference?.trim() || null,
      status: payload.status,
      notes: payload.notes?.trim() || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("leads")
      .update(leadUpdate)
      .eq("account_id", account.id)
      .eq("id", leadId)
      .select("id, customer_name, customer_phone, issue_type, address, urgency, callback_preference, status, notes, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        id: data.id,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        issueType: data.issue_type,
        address: data.address,
        urgency: data.urgency,
        callbackPreference: data.callback_preference,
        status: data.status,
        notes: data.notes,
        updatedAt: data.updated_at
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lead update error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update lead."
      },
      { status: 500 }
    );
  }
}
