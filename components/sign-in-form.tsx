create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users (id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  business_phone text,
  plan_tier text not null default 'starter' check (plan_tier in ('starter', 'pro', 'growth')),
  timezone text not null default 'America/New_York',
  service_area jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.missed_calls (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  provider_call_id text unique,
  caller_name text,
  caller_phone text not null,
  destination_phone text,
  call_started_at timestamptz not null,
  call_ended_at timestamptz,
  duration_seconds integer not null default 0,
  voicemail_url text,
  transcription text,
  call_status text not null default 'missed'
    check (call_status in ('missed', 'voicemail', 'returned', 'ignored')),
  recovery_status text not null default 'pending'
    check (recovery_status in ('pending', 'texted', 'engaged', 'qualified', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  missed_call_id uuid references public.missed_calls (id) on delete set null,
  contact_name text,
  contact_phone text not null,
  channel text not null default 'sms' check (channel in ('sms', 'webchat')),
  status text not null default 'open' check (status in ('open', 'qualified', 'booked', 'closed')),
  assigned_to_user_id uuid references auth.users (id) on delete set null,
  latest_message_preview text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  provider_message_id text unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_type text not null check (sender_type in ('customer', 'system', 'team_member')),
  body text not null,
  delivery_status text not null default 'sent'
    check (delivery_status in ('queued', 'sent', 'delivered', 'failed', 'received')),
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  missed_call_id uuid references public.missed_calls (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  service_category text not null,
  job_type text,
  urgency text not null default 'standard' check (urgency in ('emergency', 'same_day', 'standard')),
  neighborhood text,
  source text not null default 'missed_call_text_back',
  estimated_value numeric(10, 2),
  status text not null default 'new'
    check (status in ('new', 'qualified', 'quoted', 'won', 'lost')),
  notes text,
  booked_job_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.accounts (id) on delete cascade,
  missed_call_sms_enabled boolean not null default true,
  missed_call_email_enabled boolean not null default true,
  lead_digest_enabled boolean not null default true,
  after_hours_alerts_enabled boolean not null default true,
  escalation_phone text,
  notification_emails text[] not null default '{}'::text[],
  quiet_hours jsonb not null default '{"enabled": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  template_type text not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.opt_outs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  phone_number text not null,
  opted_out boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  event_type text not null,
  sent_channels text[] not null default '{}'::text[],
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  provider_event_id text,
  event_type text not null,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'skipped', 'failed')),
  request_signature text,
  request_ip text,
  payload jsonb,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.accounts
  add column if not exists twilio_phone_number text,
  add column if not exists owner_name text,
  add column if not exists email text,
  add column if not exists office_hours_json jsonb not null default '{}'::jsonb;

alter table public.notification_settings
  add column if not exists notify_email text,
  add column if not exists notify_sms_number text;

alter table public.missed_calls
  add column if not exists call_sid text,
  add column if not exists caller_number text,
  add column if not exists called_number text,
  add column if not exists direction text,
  add column if not exists call_time timestamptz,
  add column if not exists raw_event jsonb,
  add column if not exists auto_text_sent boolean not null default false,
  add column if not exists auto_text_sent_at timestamptz;

alter table public.leads
  add column if not exists issue_type text,
  add column if not exists address text,
  add column if not exists callback_preference text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'leads_status_check'
  ) then
    alter table public.leads
      drop constraint leads_status_check;
  end if;
exception
  when undefined_object then
    null;
end
$$;

do $$
begin
  alter table public.leads
    add constraint leads_status_check
    check (status in ('new', 'contacted', 'booked', 'closed-lost'));
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'missed_calls_call_status_check'
  ) then
    alter table public.missed_calls
      drop constraint missed_calls_call_status_check;
  end if;
exception
  when undefined_object then
    null;
end
$$;

do $$
begin
  alter table public.missed_calls
    add constraint missed_calls_call_status_check
    check (
      call_status in (
        'missed',
        'voicemail',
        'returned',
        'ignored',
        'no-answer',
        'busy',
        'failed',
        'canceled',
        'incomplete'
      )
    );
exception
  when duplicate_object then
    null;
end
$$;

create index if not exists missed_calls_account_started_idx
  on public.missed_calls (account_id, call_started_at desc);

create index if not exists missed_calls_account_phone_idx
  on public.missed_calls (account_id, caller_phone);

create unique index if not exists missed_calls_call_sid_idx
  on public.missed_calls (call_sid)
  where call_sid is not null;

create index if not exists missed_calls_account_called_time_idx
  on public.missed_calls (account_id, called_number, call_time desc);

create index if not exists missed_calls_account_caller_auto_text_idx
  on public.missed_calls (account_id, caller_number, auto_text_sent_at desc)
  where auto_text_sent = true;

create index if not exists conversations_account_updated_idx
  on public.conversations (account_id, updated_at desc);

create index if not exists conversations_account_phone_idx
  on public.conversations (account_id, contact_phone);

create index if not exists messages_conversation_sent_idx
  on public.messages (conversation_id, sent_at asc);

create index if not exists messages_account_created_idx
  on public.messages (account_id, created_at desc);

create index if not exists notification_events_conversation_type_created_idx
  on public.notification_events (conversation_id, event_type, created_at desc);

create index if not exists notification_events_account_created_idx
  on public.notification_events (account_id, created_at desc);

create index if not exists webhook_events_source_created_idx
  on public.webhook_events (source, created_at desc);

create unique index if not exists webhook_events_dedupe_idx
  on public.webhook_events (source, provider_event_id, event_type)
  where provider_event_id is not null;

create index if not exists leads_account_status_idx
  on public.leads (account_id, status, created_at desc);

create index if not exists leads_account_phone_idx
  on public.leads (account_id, customer_phone);

create index if not exists templates_account_type_active_idx
  on public.templates (account_id, template_type, is_active);

create index if not exists templates_account_name_idx
  on public.templates (account_id, name);

create unique index if not exists templates_account_type_active_unique_idx
  on public.templates (account_id, template_type)
  where is_active = true;

create unique index if not exists opt_outs_account_phone_idx
  on public.opt_outs (account_id, phone_number);

create unique index if not exists accounts_twilio_phone_number_idx
  on public.accounts (twilio_phone_number)
  where twilio_phone_number is not null;

alter table public.accounts enable row level security;
alter table public.missed_calls enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.notification_settings enable row level security;
alter table public.templates enable row level security;
alter table public.opt_outs enable row level security;
alter table public.notification_events enable row level security;
alter table public.webhook_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'accounts' and policyname = 'Users manage own account'
  ) then
    create policy "Users manage own account" on public.accounts
      for all
      using ((select auth.uid()) = owner_user_id)
      with check ((select auth.uid()) = owner_user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'webhook_events' and policyname = 'Users manage own webhook events'
  ) then
    create policy "Users manage own webhook events" on public.webhook_events
      for all
      using (false)
      with check (false);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notification_events' and policyname = 'Users manage own notification events'
  ) then
    create policy "Users manage own notification events" on public.notification_events
      for all
      using (
        exists (
          select 1
          from public.accounts
          where accounts.id = notification_events.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.accounts
          where accounts.id = notification_events.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'missed_calls' and policyname = 'Users manage own missed calls'
  ) then
    create policy "Users manage own missed calls" on public.missed_calls
      for all
      using (
        exists (
          select 1
          from public.accounts
          where accounts.id = missed_calls.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.accounts
          where accounts.id = missed_calls.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'conversations' and policyname = 'Users manage own conversations'
  ) then
    create policy "Users manage own conversations" on public.conversations
      for all
      using (
        exists (
          select 1
          from public.accounts
          where accounts.id = conversations.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.accounts
          where accounts.id = conversations.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages' and policyname = 'Users manage own messages'
  ) then
    create policy "Users manage own messages" on public.messages
      for all
      using (
        exists (
          select 1
          from public.accounts
          where accounts.id = messages.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.accounts
          where accounts.id = messages.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'Users manage own leads'
  ) then
    create policy "Users manage own leads" on public.leads
      for all
      using (
        exists (
          select 1
          from public.accounts
          where accounts.id = leads.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.accounts
          where accounts.id = leads.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notification_settings' and policyname = 'Users manage own notification settings'
  ) then
    create policy "Users manage own notification settings" on public.notification_settings
      for all
      using (
        exists (
          select 1
          from public.accounts
          where accounts.id = notification_settings.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.accounts
          where accounts.id = notification_settings.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'templates' and policyname = 'Users manage own templates'
  ) then
    create policy "Users manage own templates" on public.templates
      for all
      using (
        exists (
          select 1
          from public.accounts
          where accounts.id = templates.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.accounts
          where accounts.id = templates.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'opt_outs' and policyname = 'Users manage own opt outs'
  ) then
    create policy "Users manage own opt outs" on public.opt_outs
      for all
      using (
        exists (
          select 1
          from public.accounts
          where accounts.id = opt_outs.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.accounts
          where accounts.id = opt_outs.account_id
          and accounts.owner_user_id = (select auth.uid())
        )
      );
  end if;
end
$$;
