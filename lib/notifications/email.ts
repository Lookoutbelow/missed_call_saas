import type { LeadReplyNotificationPayload } from "@/lib/notifications/types";

export async function sendLeadReplyEmailNotification(
  payload: LeadReplyNotificationPayload,
  recipients: string[]
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !from || recipients.length === 0) {
    return false;
  }

  const subject = `New lead reply for ${payload.businessName}`;
  const html = [
    `<p><strong>Business:</strong> ${payload.businessName}</p>`,
    `<p><strong>Customer phone:</strong> ${payload.customerPhone}</p>`,
    `<p><strong>Latest message:</strong> ${payload.latestMessage}</p>`,
    `<p><strong>Timestamp:</strong> ${payload.timestamp}</p>`
  ].join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      html
    })
  });

  return response.ok;
}
