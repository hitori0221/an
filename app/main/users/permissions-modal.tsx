"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SystemPermission } from "@/lib/system-permission-types";

const resources = [
  { key: "dashboard", actions: ["view"] },
  { key: "manager_view", actions: ["view"] },
  { key: "subscribers", actions: ["view", "create", "edit", "delete"] },
  { key: "installations", actions: ["view", "create", "edit", "delete"] },
  { key: "job_orders", actions: ["view", "create", "edit", "delete"] },
  { key: "service_requests", actions: ["view", "create", "edit", "delete"] },
  { key: "payments", actions: ["view", "create", "edit", "delete"] },
  { key: "expirations", actions: ["view", "create", "edit", "delete"] },
  { key: "collections", actions: ["view", "create", "edit", "delete"] },
  { key: "subscription_plans", actions: ["view", "create", "edit", "delete"] },
  { key: "modems", actions: ["view", "create", "edit", "delete"] },
  { key: "branches", actions: ["view", "create", "edit", "delete"] },
  { key: "system_users", actions: ["view", "create", "edit", "delete"] },
] as const;
const actions = ["view", "create", "edit", "delete"] as const;
const label = (value: string) =>
  value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

export function PermissionsModal({
  open,
  onOpenChange,
  permissions: roles,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: SystemPermission[];
  onChange: (items: SystemPermission[]) => void;
}) {
  const [editing, setEditing] = useState<SystemPermission | null>(null);
  const [name, setName] = useState("");
  const [branchRequired, setBranchRequired] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const readOnly = Boolean(editing?.isBuiltIn);
  const reset = () => {
    setEditing(null);
    setName("");
    setBranchRequired(false);
    setSelected([]);
    setError("");
  };
  const edit = (role: SystemPermission) => {
    setEditing(role);
    setName(role.name);
    setBranchRequired(role.branchRequired);
    setSelected(role.permissions);
    setError("");
  };
  const toggle = (key: string) =>
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );

  async function save() {
    if (!name.trim()) {
      setError("Role name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const response = await fetch(
      editing
        ? `/api/system-permissions/${editing.id}`
        : "/api/system-permissions",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, branchRequired, permissions: selected }),
      },
    );
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to save role");
      return;
    }
    onChange(
      editing
        ? roles.map((item) =>
            item.id === editing.id ? result.permission : item,
          )
        : [...roles, result.permission].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
    );
    reset();
  }

  async function remove(role: SystemPermission) {
    setError("");
    const response = await fetch(`/api/system-permissions/${role.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Unable to delete role");
      return;
    }
    onChange(roles.filter((item) => item.id !== role.id));
    if (editing?.id === role.id) reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-4rem)] sm:max-w-[900px]">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
          <DialogTitle className="text-base">Roles & Permissions</DialogTitle>
          <DialogDescription>
            Create roles and control access to every system resource.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 md:grid-cols-[220px_1fr]">
          <aside className="flex min-h-0 flex-col border-b bg-muted/10 md:border-r md:border-b-0">
            <div className="flex-1 overflow-y-auto p-3">
              {roles.map((role) => (
                <div key={role.id} className="mb-1 flex items-center gap-1">
                  <Button
                    variant={editing?.id === role.id ? "secondary" : "ghost"}
                    size="sm"
                    className="h-auto min-w-0 flex-1 justify-start py-2 text-left"
                    onClick={() => edit(role)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {role.name}
                      </span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {role.isBuiltIn
                          ? "Full access"
                          : `${role.permissions.length} permissions`}
                      </span>
                    </span>
                  </Button>
                  {!role.isBuiltIn && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${role.name}`}
                      onClick={() => remove(role)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={reset}
              >
                New role
              </Button>
            </div>
          </aside>
          <div className="min-h-0 overflow-y-auto px-6 py-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">
                  {editing ? editing.name : "Create role"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {readOnly
                    ? "Built-in role with unrestricted access."
                    : "Configure the role and its allowed actions."}
                </p>
              </div>
              {readOnly && <Badge variant="secondary">Built in</Badge>}
            </div>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="role-name">Role name</FieldLabel>
                <Input
                  id="role-name"
                  value={name}
                  disabled={readOnly}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Branch Supervisor"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="role-branch">Branch scope</FieldLabel>
                <Select
                  disabled={readOnly}
                  value={branchRequired ? "required" : "none"}
                  onValueChange={(value) =>
                    setBranchRequired(value === "required")
                  }
                >
                  <SelectTrigger id="role-branch" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">All branches</SelectItem>
                      <SelectItem value="required">
                        Assigned branch only
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <div className="mt-5 overflow-x-auto rounded-md border">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      Resource
                    </th>
                    {actions.map((action) => (
                      <th
                        key={action}
                        className="px-3 py-2 text-center font-medium"
                      >
                        {label(action)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.key} className="border-t">
                      <td className="px-3 py-2 font-medium">
                        {label(resource.key)}
                      </td>
                      {actions.map((action) => {
                        const key = `${resource.key}.${action}`;
                        const isAvailable = (
                          resource.actions as readonly string[]
                        ).includes(action);
                        return (
                          <td key={key} className="px-3 py-2 text-center">
                            {isAvailable ? (
                              <Checkbox
                                checked={selected.includes(key)}
                                disabled={readOnly}
                                onCheckedChange={() => toggle(key)}
                                aria-label={`${label(resource.key)} ${action}`}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t bg-muted/10 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {editing && !readOnly && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Cancel edit
            </Button>
          )}
          {!readOnly && (
            <Button size="sm" disabled={saving} onClick={save}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create role"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
