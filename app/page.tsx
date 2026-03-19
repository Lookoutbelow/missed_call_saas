import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { SignInForm } from "@/components/sign-in-form";

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="hero-card">
        <BrandMark />
        <p className="hero-copy">
          A missed-call text-back platform for plumbing companies that need to recover emergencies, quotes,
          and after-hours jobs without making dispatch live on the phone.
        </p>
        <div className="hero-grid">
          <div>
            <span className="hero-metric">18</span>
            <p>Recovered calls today</p>
          </div>
          <div>
            <span className="hero-metric">46 sec</span>
            <p>Average first response</p>
          </div>
          <div>
            <span className="hero-metric">$4.2k</span>
            <p>Pipeline recovered this week</p>
          </div>
        </div>
      </section>
      <section className="auth-card">
        <div>
          <p className="eyebrow">Supabase auth</p>
          <h2>Sign in to the starter dashboard</h2>
          <p className="auth-copy">
            This starter uses email magic links and a Postgres schema built around conversations, leads,
            dispatching, and team settings.
          </p>
        </div>
        <SignInForm />
        <p className="auth-footnote">
          Need a quick preview? After wiring Supabase env vars, use the seeded routes to shape the product.
          <Link href="/dashboard"> View dashboard shell</Link>
        </p>
      </section>
    </main>
  );
}
