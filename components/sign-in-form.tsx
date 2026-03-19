"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("dispatch@sunstateplumbing.com");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      setMessage(error ? error.message : "Magic link sent. Check your inbox to sign in.");
      if (!error) {
        router.refresh();
      }
    });
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
