"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/shared/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import type { SystemUser } from "@/lib/system-user-types";
import type { Branch } from "@/app/main/branches/_components/data-table/types";
import type { SystemPermission } from "@/lib/system-permission-types";
import { UserModal } from "./user-modal";
import { PermissionsModal } from "./permissions-modal";
import { getUserColumns, userColumnClassNames } from "./user-columns";

export function UsersClient({
  initialUsers,
  branches,
  initialPermissions,
  initialError = "",
}: {
  initialUsers: SystemUser[];
  branches: Branch[];
  initialPermissions: SystemPermission[];
  initialError?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [deleting, setDeleting] = useState<SystemUser | null>(null);
  const [permissions, setPermissions] = useState(initialPermissions);
  const createOpen = searchParams.get("create") === "1";
  const permissionsOpen = searchParams.get("permissions") === "1";
  const columns = useMemo(
    () => getUserColumns({ onEdit: setEditing, onDelete: setDeleting }),
    [],
  );
  const closeCreate = () => router.replace(pathname, { scroll: false });

  useEffect(() => {
    if (initialError) toast.error(initialError);
  }, [initialError]);

  async function save(
    payload: {
      email: string;
      password?: string;
      fullName: string;
      permissionId: string;
      branchId: string | null;
    },
    user?: SystemUser,
  ) {
    const response = await fetch(
      user ? `/api/system-users/${user.id}` : "/api/system-users",
      {
        method: user ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      toast.error(result.error ?? "Unable to save user");
      return false;
    }
    setUsers((current) =>
      user
        ? current.map((item) => (item.id === user.id ? result.user : item))
        : [result.user, ...current],
    );
    if (user) setEditing(null);
    else closeCreate();
    return true;
  }

  async function remove() {
    if (!deleting) return;
    const response = await fetch(`/api/system-users/${deleting.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok) {
      toast.error(result.error ?? "Unable to delete user");
      return;
    }
    setUsers((current) => current.filter((user) => user.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-4">
      <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight">System Users</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Create and manage staff accounts that can sign in to the system.
            These accounts are separate from subscribers.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{users.length} accounts</Badge>
          <Badge variant="outline">
            {users.filter((user) => user.role === "admin").length} admins
          </Badge>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        columnClassNames={userColumnClassNames}
        itemLabel="users"
        minWidthClassName="min-w-[820px]"
      />
      {createOpen && (
        <UserModal
          permissions={permissions}
          branches={branches}
          open
          onOpenChange={(open) => !open && closeCreate()}
          onSave={(payload) => save(payload)}
        />
      )}
      {editing && (
        <UserModal
          permissions={permissions}
          branches={branches}
          user={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onSave={(payload) => save(payload, editing)}
        />
      )}
      <PermissionsModal
        open={permissionsOpen}
        onOpenChange={(open) =>
          !open && router.replace(pathname, { scroll: false })
        }
        permissions={permissions}
        onChange={setPermissions}
      />
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete system account?</DialogTitle>
            <DialogDescription>
              {deleting?.email} will immediately lose access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={remove}>
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
