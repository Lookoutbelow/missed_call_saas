import { NextRequest, NextResponse } from "next/server";

import { getCurrentAccount } from "@/lib/account";
import { getLeadDetail } from "@/lib/leads/data";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    const account = await getCurrentAccount();
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId } = await context.params;
    const lead = await getLeadDetail(account.id, leadId);

    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(lead, { status: 200 });
  } catch (error) {
    console.error("Lead detail load error", error);
    return NextResponse.json({ error: "Failed to load lead" }, { status: 500 });
  }
}
