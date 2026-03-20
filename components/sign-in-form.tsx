"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("dispatch@sunstateplumbing.com");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsPending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      });

      setMessage(error ? error.message : "Magic link sent. Check your inbox to sign in.");
      if (!error) {
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send magic link.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="sign-in-form" onSubmit={handleSubmit}>
      <label htmlFor="email">Work email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="dispatch@yourshop.com"
        required
      />
      <button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send magic link"}
      </button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
