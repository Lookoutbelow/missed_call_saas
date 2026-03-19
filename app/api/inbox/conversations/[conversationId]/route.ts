import { NextRequest, NextResponse } from "next/server";

import { getCurrentAccount } from "@/lib/account";
import { getInboxConversationDetail } from "@/lib/inbox/data";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const account = await getCurrentAccount();
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;
    const detail = await getInboxConversationDetail(account.id, conversationId);

    if (!detail) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    console.error("Inbox conversation load error", error);
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}
