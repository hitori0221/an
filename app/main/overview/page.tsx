import { redirect } from "next/navigation";

import {
  canAccess,
  getCurrentMainPermissions,
  getMainLandingPath,
} from "@/lib/access-control";
import { getDashboardData } from "@/lib/dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const permissions = await getCurrentMainPermissions();

  if (!canAccess(permissions, "dashboard")) {
    const landingPath = getMainLandingPath(permissions, "");
    if (landingPath) redirect(landingPath);

    return (
      <main className="flex min-h-full items-center justify-center bg-muted/25 p-6">
        <section className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">No access</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Dashboard permission required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Ask an administrator to grant view access to Dashboard or another
            system page.
          </p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email =
    typeof claimsData?.claims?.email === "string"
      ? claimsData.claims.email
      : "";
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("full_name, email")
    .eq("id", claimsData?.claims?.sub ?? "")
    .maybeSingle();
  const userName = profile?.full_name || email.split("@")[0] || "team";

  const data = await getDashboardData();
  return (
    <DashboardClient
      data={data}
      canViewManager={canAccess(permissions, "manager_view")}
      userName={userName}
    />
  );
}
