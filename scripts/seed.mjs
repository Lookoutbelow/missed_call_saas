import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEMO_USER_EMAIL = "owner@harborplumbingdemo.com";
const DEMO_USER_PASSWORD = "DemoPlumbing123!";
const DEMO_SLUG = "harbor-plumbing-demo";
const DEMO_TWILIO_NUMBER = "+15551230001";

const OFFICE_HOURS = {
  monday: { isOpen: true, open: "08:00", close: "17:00" },
  tuesday: { isOpen: true, open: "08:00", close: "17:00" },
  wednesday: { isOpen: true, open: "08:00", close: "17:00" },
  thursday: { isOpen: true, open: "08:00", close: "17:00" },
  friday: { isOpen: true, open: "08:00", close: "17:00" },
  saturday: { isOpen: true, open: "09:00", close: "13:00" },
  sunday: { isOpen: false, open: "09:00", close: "13:00" }
};

function isoAtOffset(minutesAgo) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

async function ensureDemoUser() {
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw listError;
  }

  const existingUser = existingUsers.users.find((user) => user.email === DEMO_USER_EMAIL);
  if (existingUser) {
    return existingUser;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: "Morgan Lee"
    }
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function removeExistingDemoAccount() {
  const demoUser = await ensureDemoUser();
  const { data: existingAccounts, error } = await supabase
    .from("accounts")
    .select("id")
    .or(`slug.eq.${DEMO_SLUG},owner_user_id.eq.${demoUser.id}`);

  if (error) {
    throw error;
  }

  if (!existingAccounts || existingAccounts.length === 0) {
    return;
  }

  const ids = existingAccounts.map((account) => account.id);
  const { error: deleteError } = await supabase.from("accounts").delete().in("id", ids);
  if (deleteError) {
    throw deleteError;
  }
}

async function createDemoAccount(ownerUserId) {
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      owner_user_id: ownerUserId,
      business_name: "Harbor Plumbing & Drain",
      owner_name: "Morgan Lee",
      email: DEMO_USER_EMAIL,
      slug: DEMO_SLUG,
      business_phone: "+15615550199",
      twilio_phone_number: DEMO_TWILIO_NUMBER,
      timezone: "America/New_York",
      plan_tier: "pro",
      office_hours_json: OFFICE_HOURS,
      service_area: ["West Palm Beach", "Lake Worth", "Boynton Beach"]
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function createNotificationSettings(accountId) {
  const { error } = await supabase.from("notification_settings").insert({
    account_id: accountId,
    notify_email: DEMO_USER_EMAIL,
    notify_sms_number: "+15615550123",
    notification_emails: [DEMO_USER_EMAIL],
    escalation_phone: "+15615550123",
    missed_call_sms_enabled: true,
    missed_call_email_enabled: true,
    lead_digest_enabled: true,
    after_hours_alerts_enabled: true
  });

  if (error) {
    throw error;
  }
}

async function createTemplates(accountId) {
  const templates = [
    {
      account_id: accountId,
      name: "Missed call template",
      template_type: "missed_call",
      body: "Sorry we missed your call. Thanks for reaching out to {{business_name}}. Reply with the issue and we'll get back to you ASAP.",
      is_active: true
    },
    {
      account_id: accountId,
      name: "After-hours template",
      template_type: "after_hours",
      body: "Thanks for contacting {{business_name}} after hours. Send a few details about the issue and we’ll line up the next available plumber.",
      is_active: true
    }
  ];

  const { error } = await supabase.from("templates").insert(templates);
  if (error) {
    throw error;
  }
}

async function createMissedCalls(accountId) {
  const records = [
    {
      account_id: accountId,
      caller_name: "Ava Morales",
      caller_phone: "+15615550111",
      destination_phone: DEMO_TWILIO_NUMBER,
      caller_number: "+15615550111",
      called_number: DEMO_TWILIO_NUMBER,
      call_sid: "CA_DEMO_LEAK_UNDER_SINK",
      provider_call_id: "CA_DEMO_LEAK_UNDER_SINK",
      direction: "inbound",
      call_time: isoAtOffset(140),
      call_started_at: isoAtOffset(140),
      call_status: "no-answer",
      recovery_status: "texted",
      auto_text_sent: true,
      auto_text_sent_at: isoAtOffset(138)
    },
    {
      account_id: accountId,
      caller_name: "James Benton",
      caller_phone: "+15615550112",
      destination_phone: DEMO_TWILIO_NUMBER,
      caller_number: "+15615550112",
      called_number: DEMO_TWILIO_NUMBER,
      call_sid: "CA_DEMO_WATER_HEATER",
      provider_call_id: "CA_DEMO_WATER_HEATER",
      direction: "inbound",
      call_time: isoAtOffset(95),
      call_started_at: isoAtOffset(95),
      call_status: "busy",
      recovery_status: "engaged",
      auto_text_sent: true,
      auto_text_sent_at: isoAtOffset(92)
    },
    {
      account_id: accountId,
      caller_name: "Riverside Deli",
      caller_phone: "+15615550113",
      destination_phone: DEMO_TWILIO_NUMBER,
      caller_number: "+15615550113",
      called_number: DEMO_TWILIO_NUMBER,
      call_sid: "CA_DEMO_MAIN_DRAIN",
      provider_call_id: "CA_DEMO_MAIN_DRAIN",
      direction: "inbound",
      call_time: isoAtOffset(50),
      call_started_at: isoAtOffset(50),
      call_status: "no-answer",
      recovery_status: "qualified",
      auto_text_sent: true,
      auto_text_sent_at: isoAtOffset(48)
    }
  ];

  const { data, error } = await supabase
    .from("missed_calls")
    .insert(records)
    .select("id, caller_phone");

  if (error) {
    throw error;
  }

  return new Map(data.map((row) => [row.caller_phone, row.id]));
}

async function createConversations(accountId, missedCallIds) {
  const rows = [
    {
      account_id: accountId,
      missed_call_id: missedCallIds.get("+15615550111"),
      contact_name: "Ava Morales",
      contact_phone: "+15615550111",
      channel: "sms",
      status: "open",
      latest_message_preview: "There’s a leak under the kitchen sink and the cabinet is soaked.",
      last_message_at: isoAtOffset(130),
      updated_at: isoAtOffset(130)
    },
    {
      account_id: accountId,
      missed_call_id: missedCallIds.get("+15615550112"),
      contact_name: "James Benton",
      contact_phone: "+15615550112",
      channel: "sms",
      status: "qualified",
      latest_message_preview: "Water heater isn’t heating. Can someone come this afternoon?",
      last_message_at: isoAtOffset(86),
      updated_at: isoAtOffset(86)
    },
    {
      account_id: accountId,
      missed_call_id: missedCallIds.get("+15615550113"),
      contact_name: "Riverside Deli",
      contact_phone: "+15615550113",
      channel: "sms",
      status: "booked",
      latest_message_preview: "Main drain backup in the kitchen. We open at 11 and need help before then.",
      last_message_at: isoAtOffset(42),
      updated_at: isoAtOffset(42)
    }
  ];

  const { data, error } = await supabase
    .from("conversations")
    .insert(rows)
    .select("id, contact_phone");

  if (error) {
    throw error;
  }

  return new Map(data.map((row) => [row.contact_phone, row.id]));
}

async function createLeads(accountId, conversationIds, missedCallIds) {
  const leads = [
    {
      account_id: accountId,
      missed_call_id: missedCallIds.get("+15615550111"),
      conversation_id: conversationIds.get("+15615550111"),
      customer_name: "Ava Morales",
      customer_phone: "+15615550111",
      service_category: "Leak repair",
      issue_type: "leak",
      address: "214 Gardenia Ave, West Palm Beach, FL",
      urgency: "same_day",
      callback_preference: "Text first, then call",
      source: "missed_call_text_back",
      status: "new",
      notes: "Leak under sink started this morning and warped the cabinet floor.",
      updated_at: isoAtOffset(130)
    },
    {
      account_id: accountId,
      missed_call_id: missedCallIds.get("+15615550112"),
      conversation_id: conversationIds.get("+15615550112"),
      customer_name: "James Benton",
      customer_phone: "+15615550112",
      service_category: "Water heater service",
      issue_type: "water_heater",
      address: "8895 Pine Ridge Rd, Lake Worth, FL",
      urgency: "standard",
      callback_preference: "Call after 1 PM",
      source: "missed_call_text_back",
      status: "contacted",
      notes: "Gas water heater not heating since last night. Pilot appears to be on.",
      updated_at: isoAtOffset(86)
    },
    {
      account_id: accountId,
      missed_call_id: missedCallIds.get("+15615550113"),
      conversation_id: conversationIds.get("+15615550113"),
      customer_name: "Riverside Deli",
      customer_phone: "+15615550113",
      service_category: "Main drain service",
      issue_type: "drain",
      address: "431 Clematis St, West Palm Beach, FL",
      urgency: "emergency",
      callback_preference: "Call manager cell immediately",
      source: "missed_call_text_back",
      status: "booked",
      notes: "Main drain backup affecting prep sink and floor drain. Crew expected before opening.",
      updated_at: isoAtOffset(42)
    }
  ];

  const { error } = await supabase.from("leads").insert(leads);
  if (error) {
    throw error;
  }
}

async function createMessages(accountId, conversationIds) {
  const messages = [
    {
      account_id: accountId,
      conversation_id: conversationIds.get("+15615550111"),
      provider_message_id: "SM_DEMO_001",
      direction: "outbound",
      sender_type: "system",
      body: "Sorry we missed your call. Thanks for reaching out to Harbor Plumbing & Drain. Reply with the issue and we'll get back to you ASAP.",
      delivery_status: "sent",
      sent_at: isoAtOffset(138)
    },
    {
      account_id: accountId,
      conversation_id: conversationIds.get("+15615550111"),
      provider_message_id: "SM_DEMO_002",
      direction: "inbound",
      sender_type: "customer",
      body: "There’s a leak under the kitchen sink and the cabinet is soaked.",
      delivery_status: "received",
      sent_at: isoAtOffset(130)
    },
    {
      account_id: accountId,
      conversation_id: conversationIds.get("+15615550112"),
      provider_message_id: "SM_DEMO_003",
      direction: "outbound",
      sender_type: "system",
      body: "Sorry we missed your call. Thanks for reaching out to Harbor Plumbing & Drain. Reply with the issue and we'll get back to you ASAP.",
      delivery_status: "sent",
      sent_at: isoAtOffset(92)
    },
    {
      account_id: accountId,
      conversation_id: conversationIds.get("+15615550112"),
      provider_message_id: "SM_DEMO_004",
      direction: "inbound",
      sender_type: "customer",
      body: "Water heater isn’t heating. Can someone come this afternoon?",
      delivery_status: "received",
      sent_at: isoAtOffset(86)
    },
    {
      account_id: accountId,
      conversation_id: conversationIds.get("+15615550112"),
      provider_message_id: "SM_DEMO_005",
      direction: "outbound",
      sender_type: "team_member",
      body: "Yes, we can have a plumber call you after lunch and confirm the arrival window.",
      delivery_status: "sent",
      sent_at: isoAtOffset(82)
    },
    {
      account_id: accountId,
      conversation_id: conversationIds.get("+15615550113"),
      provider_message_id: "SM_DEMO_006",
      direction: "outbound",
      sender_type: "system",
      body: "Sorry we missed your call. Thanks for reaching out to Harbor Plumbing & Drain. Reply with the issue and we'll get back to you ASAP.",
      delivery_status: "sent",
      sent_at: isoAtOffset(48)
    },
    {
      account_id: accountId,
      conversation_id: conversationIds.get("+15615550113"),
      provider_message_id: "SM_DEMO_007",
      direction: "inbound",
      sender_type: "customer",
      body: "Main drain backup in the kitchen. We open at 11 and need help before then.",
      delivery_status: "received",
      sent_at: isoAtOffset(42)
    },
    {
      account_id: accountId,
      conversation_id: conversationIds.get("+15615550113"),
      provider_message_id: "SM_DEMO_008",
      direction: "outbound",
      sender_type: "team_member",
      body: "Dispatch booked your drain tech for this morning. We’ll text when the truck is on the way.",
      delivery_status: "sent",
      sent_at: isoAtOffset(36)
    }
  ];

  const { error } = await supabase.from("messages").insert(messages);
  if (error) {
    throw error;
  }
}

async function main() {
  console.log("Seeding local demo data...");

  const demoUser = await ensureDemoUser();
  await removeExistingDemoAccount();

  const accountId = await createDemoAccount(demoUser.id);
  await createNotificationSettings(accountId);
  await createTemplates(accountId);
  const missedCallIds = await createMissedCalls(accountId);
  const conversationIds = await createConversations(accountId, missedCallIds);
  await createLeads(accountId, conversationIds, missedCallIds);
  await createMessages(accountId, conversationIds);

  console.log("Seed complete.");
  console.log(`Demo owner email: ${DEMO_USER_EMAIL}`);
  console.log(`Demo owner password: ${DEMO_USER_PASSWORD}`);
  console.log(`Demo Twilio placeholder number: ${DEMO_TWILIO_NUMBER}`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
