import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/", "/onboarding/:path*", "/dashboard/:path*", "/inbox/:path*", "/leads/:path*", "/settings/:path*"]
};
