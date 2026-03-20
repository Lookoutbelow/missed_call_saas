import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";

type CookieWrite = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieWrite[]) {
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as any);
          });
        }
      }
    }) as any;

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const isAuthPage = request.nextUrl.pathname === "/";
    const isOnboardingPage = request.nextUrl.pathname === "/onboarding";

    if (!user && !isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (user) {
      const { data: account } = await supabase
        .from("accounts")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = account ? "/dashboard" : "/onboarding";
        return NextResponse.redirect(url);
      }

      if (!account && !isOnboardingPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      if (account && isOnboardingPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    return response;
  } catch (error) {
    console.error("Supabase middleware error", error);
    return NextResponse.next({ request });
  }
}
