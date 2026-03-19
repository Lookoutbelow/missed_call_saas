"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OnboardingFormState = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  timezone: string;
};

type OnboardingFormProps = {
  initialEmail: string;
};

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix"
];

function validate(form: OnboardingFormState) {
  const errors: Record<string, string> = {};

  if (!form.businessName.trim()) {
    errors.businessName = "Business name is required.";
  }
  if (!form.ownerName.trim()) {
    errors.ownerName = "Owner name is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email.";
  }
  if (!/^[0-9+()\-\s]{7,}$/.test(form.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }

  return errors;
}

export function OnboardingForm({ initialEmail }: OnboardingFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingFormState>({
    businessName: "",
    ownerName: "",
    email: initialEmail,
    phone: "",
    timezone: "America/New_York"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => validate(form), [form]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (Object.keys(errors).length > 0) {
      setSubmitError("Fix the highlighted fields before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Failed to create account.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to complete onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="onboarding-page">
      <section className="panel onboarding-card">
        <div>
          <p className="eyebrow">New account</p>
          <h1>Set up your shop</h1>
          <p className="hero-copy">
            We’ll create your account, seed the default templates, and prepare notification settings so
            you can move straight into the product.
          </p>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="settings-grid-form">
            <label>
              Business name
              <input
                value={form.businessName}
                onChange={(event) => setForm({ ...form, businessName: event.target.value })}
              />
              {errors.businessName ? <small className="field-error">{errors.businessName}</small> : null}
            </label>
            <label>
              Owner name
              <input
                value={form.ownerName}
                onChange={(event) => setForm({ ...form, ownerName: event.target.value })}
              />
              {errors.ownerName ? <small className="field-error">{errors.ownerName}</small> : null}
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              {errors.email ? <small className="field-error">{errors.email}</small> : null}
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              {errors.phone ? <small className="field-error">{errors.phone}</small> : null}
            </label>
            <label>
              Timezone
              <select
                value={form.timezone}
                onChange={(event) => setForm({ ...form, timezone: event.target.value })}
              >
                {TIMEZONES.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="onboarding-footer">
            {submitError ? <p className="form-message">{submitError}</p> : <span />}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
      </section>

      <aside className="panel provisioning-card">
        <p className="eyebrow">Phone number</p>
        <h2>Number provisioning pending</h2>
        <p className="sidebar-copy">
          Twilio number assignment is currently handled manually by an admin. Once a number is attached to
          your account, missed calls and SMS flows will go live automatically.
        </p>
        <div className="provisioning-placeholder">
          <strong>Pending manual assignment</strong>
          <span>Internal helper ready for future attachment automation.</span>
        </div>
      </aside>
    </main>
  );
}
