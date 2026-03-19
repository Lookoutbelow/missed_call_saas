import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding-form";
import { getCurrentAccount, getCurrentUser } from "@/lib/account";

export default async function OnboardingPage() {
  const [user, account] = await Promise.all([getCurrentUser(), getCurrentAccount()]);

  if (!user) {
    redirect("/");
  }

  if (account) {
    redirect("/dashboard");
  }

  return <OnboardingForm initialEmail={user.email ?? ""} />;
}
