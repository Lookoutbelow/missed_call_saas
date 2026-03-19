export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          owner_user_id: string;
          business_name: string;
          owner_name: string | null;
          email: string | null;
          slug: string;
          business_phone: string | null;
          twilio_phone_number: string | null;
          plan_tier: "starter" | "pro" | "growth";
          timezone: string;
          office_hours_json: Json;
          service_area: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          business_name: string;
          owner_name?: string | null;
          email?: string | null;
          slug: string;
          business_phone?: string | null;
          twilio_phone_number?: string | null;
          plan_tier?: "starter" | "pro" | "growth";
          timezone?: string;
          office_hours_json?: Json;
          service_area?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          business_name?: string;
          owner_name?: string | null;
          email?: string | null;
          slug?: string;
          business_phone?: string | null;
          twilio_phone_number?: string | null;
          plan_tier?: "starter" | "pro" | "growth";
          timezone?: string;
          office_hours_json?: Json;
          service_area?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      missed_calls: {
        Row: {
          id: string;
          account_id: string;
          provider_call_id: string | null;
          caller_name: string | null;
          caller_phone: string;
          destination_phone: string | null;
          call_started_at: string;
          call_ended_at: string | null;
          duration_seconds: number;
          voicemail_url: string | null;
          transcription: string | null;
          call_sid: string | null;
          caller_number: string | null;
          called_number: string | null;
          direction: string | null;
          call_time: string | null;
          raw_event: Json | null;
          auto_text_sent: boolean;
          auto_text_sent_at: string | null;
          call_status:
            | "missed"
            | "voicemail"
            | "returned"
            | "ignored"
            | "no-answer"
            | "busy"
            | "failed"
            | "canceled"
            | "incomplete";
          recovery_status: "pending" | "texted" | "engaged" | "qualified" | "closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          provider_call_id?: string | null;
          caller_name?: string | null;
          caller_phone: string;
          destination_phone?: string | null;
          call_started_at: string;
          call_ended_at?: string | null;
          duration_seconds?: number;
          voicemail_url?: string | null;
          transcription?: string | null;
          call_sid?: string | null;
          caller_number?: string | null;
          called_number?: string | null;
          direction?: string | null;
          call_time?: string | null;
          raw_event?: Json | null;
          auto_text_sent?: boolean;
          auto_text_sent_at?: string | null;
          call_status?:
            | "missed"
            | "voicemail"
            | "returned"
            | "ignored"
            | "no-answer"
            | "busy"
            | "failed"
            | "canceled"
            | "incomplete";
          recovery_status?: "pending" | "texted" | "engaged" | "qualified" | "closed";
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          provider_call_id?: string | null;
          caller_name?: string | null;
          caller_phone?: string;
          destination_phone?: string | null;
          call_started_at?: string;
          call_ended_at?: string | null;
          duration_seconds?: number;
          voicemail_url?: string | null;
          transcription?: string | null;
          call_sid?: string | null;
          caller_number?: string | null;
          called_number?: string | null;
          direction?: string | null;
          call_time?: string | null;
          raw_event?: Json | null;
          auto_text_sent?: boolean;
          auto_text_sent_at?: string | null;
          call_status?:
            | "missed"
            | "voicemail"
            | "returned"
            | "ignored"
            | "no-answer"
            | "busy"
            | "failed"
            | "canceled"
            | "incomplete";
          recovery_status?: "pending" | "texted" | "engaged" | "qualified" | "closed";
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          account_id: string;
          missed_call_id: string | null;
          contact_name: string | null;
          contact_phone: string;
          channel: "sms" | "webchat";
          status: "open" | "qualified" | "booked" | "closed";
          assigned_to_user_id: string | null;
          latest_message_preview: string | null;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          missed_call_id?: string | null;
          contact_name?: string | null;
          contact_phone: string;
          channel?: "sms" | "webchat";
          status?: "open" | "qualified" | "booked" | "closed";
          assigned_to_user_id?: string | null;
          latest_message_preview?: string | null;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          missed_call_id?: string | null;
          contact_name?: string | null;
          contact_phone?: string;
          channel?: "sms" | "webchat";
          status?: "open" | "qualified" | "booked" | "closed";
          assigned_to_user_id?: string | null;
          latest_message_preview?: string | null;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          account_id: string;
          conversation_id: string;
          provider_message_id: string | null;
          direction: "inbound" | "outbound";
          sender_type: "customer" | "system" | "team_member";
          body: string;
          delivery_status: "queued" | "sent" | "delivered" | "failed" | "received";
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          conversation_id: string;
          provider_message_id?: string | null;
          direction: "inbound" | "outbound";
          sender_type: "customer" | "system" | "team_member";
          body: string;
          delivery_status?: "queued" | "sent" | "delivered" | "failed" | "received";
          sent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          conversation_id?: string;
          provider_message_id?: string | null;
          direction?: "inbound" | "outbound";
          sender_type?: "customer" | "system" | "team_member";
          body?: string;
          delivery_status?: "queued" | "sent" | "delivered" | "failed" | "received";
          sent_at?: string;
          created_at?: string;
        };
      };
      notification_events: {
        Row: {
          id: string;
          account_id: string;
          conversation_id: string;
          event_type: string;
          sent_channels: string[];
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          conversation_id: string;
          event_type: string;
          sent_channels?: string[];
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          conversation_id?: string;
          event_type?: string;
          sent_channels?: string[];
          payload?: Json | null;
          created_at?: string;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          source: string;
          provider_event_id: string | null;
          event_type: string;
          processing_status: "received" | "processed" | "skipped" | "failed";
          request_signature: string | null;
          request_ip: string | null;
          payload: Json | null;
          error_message: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          provider_event_id?: string | null;
          event_type: string;
          processing_status?: "received" | "processed" | "skipped" | "failed";
          request_signature?: string | null;
          request_ip?: string | null;
          payload?: Json | null;
          error_message?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          provider_event_id?: string | null;
          event_type?: string;
          processing_status?: "received" | "processed" | "skipped" | "failed";
          request_signature?: string | null;
          request_ip?: string | null;
          payload?: Json | null;
          error_message?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          account_id: string;
          missed_call_id: string | null;
          conversation_id: string | null;
          customer_name: string;
          customer_phone: string;
          service_category: string;
          issue_type: string | null;
          job_type: string | null;
          urgency: "emergency" | "same_day" | "standard";
          neighborhood: string | null;
          address: string | null;
          callback_preference: string | null;
          source: string;
          estimated_value: number | null;
          status: "new" | "contacted" | "booked" | "closed-lost";
          notes: string | null;
          booked_job_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          missed_call_id?: string | null;
          conversation_id?: string | null;
          customer_name: string;
          customer_phone: string;
          service_category: string;
          issue_type?: string | null;
          job_type?: string | null;
          urgency?: "emergency" | "same_day" | "standard";
          neighborhood?: string | null;
          address?: string | null;
          callback_preference?: string | null;
          source?: string;
          estimated_value?: number | null;
          status?: "new" | "contacted" | "booked" | "closed-lost";
          notes?: string | null;
          booked_job_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          missed_call_id?: string | null;
          conversation_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          service_category?: string;
          issue_type?: string | null;
          job_type?: string | null;
          urgency?: "emergency" | "same_day" | "standard";
          neighborhood?: string | null;
          address?: string | null;
          callback_preference?: string | null;
          source?: string;
          estimated_value?: number | null;
          status?: "new" | "contacted" | "booked" | "closed-lost";
          notes?: string | null;
          booked_job_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_settings: {
        Row: {
          id: string;
          account_id: string;
          missed_call_sms_enabled: boolean;
          missed_call_email_enabled: boolean;
          lead_digest_enabled: boolean;
          after_hours_alerts_enabled: boolean;
          escalation_phone: string | null;
          notify_email: string | null;
          notify_sms_number: string | null;
          notification_emails: string[];
          quiet_hours: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          missed_call_sms_enabled?: boolean;
          missed_call_email_enabled?: boolean;
          lead_digest_enabled?: boolean;
          after_hours_alerts_enabled?: boolean;
          escalation_phone?: string | null;
          notify_email?: string | null;
          notify_sms_number?: string | null;
          notification_emails?: string[];
          quiet_hours?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          missed_call_sms_enabled?: boolean;
          missed_call_email_enabled?: boolean;
          lead_digest_enabled?: boolean;
          after_hours_alerts_enabled?: boolean;
          escalation_phone?: string | null;
          notify_email?: string | null;
          notify_sms_number?: string | null;
          notification_emails?: string[];
          quiet_hours?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          template_type: string;
          body: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          template_type: string;
          body: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          name?: string;
          template_type?: string;
          body?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      opt_outs: {
        Row: {
          id: string;
          account_id: string;
          phone_number: string;
          opted_out: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          phone_number: string;
          opted_out?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          phone_number?: string;
          opted_out?: boolean;
          created_at?: string;
        };
      };
    };
  };
};
