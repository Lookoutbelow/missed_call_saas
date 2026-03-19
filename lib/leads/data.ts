import { createClient } from "@/lib/supabase/server";

import type { LeadDetail, LeadListItem, LeadStatusFilter } from "@/lib/leads/types";

function mapLead(row: {
  id: string;
  customer_name: string;
  customer_phone: string;
  issue_type: string | null;
  address: string | null;
  urgency: "emergency" | "same_day" | "standard";
  callback_preference: string | null;
  status: "new" | "contacted" | "booked" | "closed-lost";
  notes: string | null;
  updated_at: string;
}): LeadListItem {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    issueType: row.issue_type,
    address: row.address,
    urgency: row.urgency,
    callbackPreference: row.callback_preference,
    status: row.status,
    notes: row.notes,
    updatedAt: row.updated_at
  };
}

export async function getLeads(
  accountId: string,
  filters?: {
    status?: LeadStatusFilter;
    phoneQuery?: string;
  }
) {
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("id, customer_name, customer_phone, issue_type, address, urgency, callback_preference, status, notes, updated_at")
    .eq("account_id", accountId)
    .order("updated_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.phoneQuery) {
    query = query.ilike("customer_phone", `%${filters.phoneQuery}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return data.map(mapLead);
}

export async function getLeadDetail(accountId: string, leadId: string): Promise<LeadDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, customer_name, customer_phone, issue_type, address, urgency, callback_preference, status, notes, updated_at")
    .eq("account_id", accountId)
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapLead(data) : null;
}
