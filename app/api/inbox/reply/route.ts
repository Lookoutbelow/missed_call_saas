import { NextRequest, NextResponse } from "next/server";

import { getCurrentAccount, getCurrentUser } from "@/lib/account";
import { sendConversationReply } from "@/lib/inbox/reply";
import { captureError } from "@/lib/monitoring";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ReplyBody = {
  conversationId?: string;
  body?: string;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const account = await getCurrentAccount();

    if (!user || !account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as ReplyBody;
    const conversationId = payload.conversationId?.trim();
    const body = payload.body?.trim();

    if (!conversationId || !body) {
      return NextResponse.json({ error: "Conversation and body are required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const reply = await sendConversationReply(supabase, {
      accountId: account.id,
      conversationId,
      body
    });

    if (!reply.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: reply.error,
          message: reply.message ?? null
        },
        { status: reply.message ? 502 : 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: reply.message,
        latestMessageAt: reply.latestMessageAt,
        providerSid: reply.providerSid
      },
      { status: 200 }
    );
  } catch (error) {
    await captureError(error, {
      route: "/api/inbox/reply"
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send reply."
      },
      { status: 500 }
    );
  }
}
