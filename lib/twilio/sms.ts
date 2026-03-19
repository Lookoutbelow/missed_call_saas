import twilio from "twilio";

let cachedClient: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Missing Twilio messaging configuration.");
  }

  cachedClient = twilio(accountSid, authToken);
  return cachedClient;
}
