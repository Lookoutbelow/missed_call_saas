import { getTwilioClient } from "@/lib/twilio/sms";

import type { LeadReplyNotificationPayload } from "@/lib/notifications/types";
import { normalizePhoneNumber } from "@/lib/twilio/normalize";

export async function sendLeadReplySmsNotification(
  payload: LeadReplyNotificationPayload,
  fromNumber: string | null,
  destinationNumber: string | null
) {
  const from = normalizePhoneNumber(fromNumber ?? undefined);
  const to = normalizePhoneNumber(destinationNumber ?? undefined);

  if (!from || !to) {
    return false;
  }

  const body =
    `New reply for ${payload.businessName}\n` +
    `Customer: ${payload.customerPhone}\n` +
    `Message: ${payload.latestMessage}\n` +
    `At: ${payload.timestamp}`;

  const twilioClient = getTwilioClient();
  await twilioClient.messages.create({
    to,
    from,
    body
  });

  return true;
}
