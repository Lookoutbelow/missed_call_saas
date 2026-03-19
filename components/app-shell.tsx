import Link from "next/link";
import { ReactNode } from "react";

import { navItems } from "@/lib/data";

export function AppShell({
  children,
  title,
  subtitle,
  userEmail
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  userEmail?: string;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">For plumbing shops</p>
          <h2>PlumbLine AI</h2>
          <p className="sidebar-copy">
            Recover missed calls, text customers back instantly, and push the best leads to dispatch.
          </p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="sidebar-link">
              <span>{item.label}</span>
              <small>{item.description}</small>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-panel">
        <header className="page-header">
          <div>
            <p className="eyebrow">Starter app</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="header-stack">
            <div className="header-card">
              <span className="status-dot" />
              Supabase auth + CRM-ready schema
            </div>
            {userEmail ? <div className="header-card">{userEmail}</div> : null}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
