"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { DataTable } from "@/components/data-table/shared/data-table";
import { Button } from "@/components/ui/button";

import { BranchModal } from "../modals/branch-modal";
import { branchColumnClassNames, getBranchColumns } from "./columns";
import type { Branch } from "./types";

type BranchesDataTableProps = {
  initialBranches: Branch[];
  onBranchesChange?: (branches: Branch[]) => void;
};

export default function BranchesDataTable({
  initialBranches,
  onBranchesChange,
}: BranchesDataTableProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [branches, setBranches] = useState(initialBranches);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [pendingDeleteBranch, setPendingDeleteBranch] = useState<Branch | null>(
    null,
  );
  const isCreateOpen = searchParams.get("create") === "1";

  const updateBranches = (
    getBranches: (currentBranches: Branch[]) => Branch[],
  ) => {
    setBranches((currentBranches) => {
      const nextBranches = getBranches(currentBranches);
      onBranchesChange?.(nextBranches);

      return nextBranches;
    });
  };

  const closeCreateModal = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("create");
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : pathname,
      {
        scroll: false,
      },
    );
  };

  const columns = useMemo(
    () =>
      getBranchColumns({
        onEdit: setEditingBranch,
        onDelete: setPendingDeleteBranch,
      }),
    [],
  );

  const handleDeleteBranch = async () => {
    if (!pendingDeleteBranch) return;

    const response = await fetch(`/api/branches/${pendingDeleteBranch.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      console.error(
        "Unable to delete branch",
        await response.json().catch(() => null),
      );
      return;
    }

    updateBranches((currentBranches) =>
      currentBranches.filter(
        (currentBranch) => currentBranch.id !== pendingDeleteBranch.id,
      ),
    );
    setEditingBranch((currentBranch) =>
      currentBranch?.id === pendingDeleteBranch.id ? null : currentBranch,
    );
    setPendingDeleteBranch(null);
  };

  const handleCreateBranch = async (branch: Branch) => {
    const response = await fetch("/api/branches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(branch),
    });

    if (!response.ok) {
      console.error(
        "Unable to create branch",
        await response.json().catch(() => null),
      );
      return;
    }

    const { branch: createdBranch } = (await response.json()) as {
      branch: Branch;
    };

    updateBranches((currentBranches) => [createdBranch, ...currentBranches]);
    closeCreateModal();
  };

  const handleUpdateBranch = async (updatedBranch: Branch) => {
    const response = await fetch(`/api/branches/${updatedBranch.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedBranch),
    });

    if (!response.ok) {
      console.error(
        "Unable to update branch",
        await response.json().catch(() => null),
      );
      return;
    }

    const { branch: savedBranch } = (await response.json()) as {
      branch: Branch;
    };

    updateBranches((currentBranches) =>
      currentBranches.map((branch) =>
        branch.id === savedBranch.id ? savedBranch : branch,
      ),
    );
    setEditingBranch(null);
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={branches}
        columnClassNames={branchColumnClassNames}
        itemLabel="branches"
        minWidthClassName="min-w-[892px]"
      />
      <BranchModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal();
        }}
        onCancel={closeCreateModal}
        onSubmit={handleCreateBranch}
      />
      <BranchModal
        key={editingBranch?.id ?? "edit-branch"}
        branch={editingBranch}
        open={Boolean(editingBranch)}
        onOpenChange={(open) => {
          if (!open) setEditingBranch(null);
        }}
        onCancel={() => setEditingBranch(null)}
        onSubmit={handleUpdateBranch}
      />
      <Dialog
        open={Boolean(pendingDeleteBranch)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteBranch(null);
        }}
      >
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete branch?</DialogTitle>
            <DialogDescription>
              {pendingDeleteBranch?.name} will be removed from Manage Branch.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPendingDeleteBranch(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteBranch}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
