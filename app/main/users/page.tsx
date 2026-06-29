import { listSystemUsers } from "@/lib/system-users";
import { listBranches } from "@/lib/branches";
import { listSystemPermissions } from "@/lib/system-permissions";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  let users: Awaited<ReturnType<typeof listSystemUsers>> = [];
  let branches: Awaited<ReturnType<typeof listBranches>> = [];
  let permissions: Awaited<ReturnType<typeof listSystemPermissions>> = [];
  let initialError = "";

  try {
    [users, branches, permissions] = await Promise.all([
      listSystemUsers(),
      listBranches(),
      listSystemPermissions(),
    ]);
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "Unable to load system users";
  }

  return (
    <UsersClient
      initialUsers={users}
      branches={branches}
      initialPermissions={permissions}
      initialError={initialError}
    />
  );
}
