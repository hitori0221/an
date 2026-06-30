import { redirect } from "next/navigation";

import {
  canAccess,
  getCurrentMainPermissions,
  getMainLandingPath,
} from "@/lib/access-control";
import { ManagerViewClient } from "./manager-view-client";

export default async function ManagerViewPage() {
  const permissions = await getCurrentMainPermissions();

  if (!canAccess(permissions, "manager_view")) {
    const landingPath = getMainLandingPath(permissions, "");
    if (landingPath) redirect(landingPath);

    return (
      <main className="flex min-h-full items-center justify-center bg-muted/25 p-6">
        <section className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">No access</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Manager View permission required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Ask an administrator to grant view access to Manager View or another
            system page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <ManagerViewClient canViewDashboard={canAccess(permissions, "dashboard")} />
  );
}
