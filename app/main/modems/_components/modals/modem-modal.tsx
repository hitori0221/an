"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Modem, ModemStatus } from "../data-table/types";

type ModemModalProps = {
  modem?: Modem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSubmit: (modem: Modem) => void;
};

const modemStatuses: ModemStatus[] = ["Active", "Maintenance", "Inactive"];

const emptyForm = {
  code: "",
  name: "",
  status: "Active" as ModemStatus,
};

function getInitialForm(modem?: Modem | null) {
  return modem
    ? {
        code: modem.code,
        name: modem.name,
        status: modem.status,
      }
    : emptyForm;
}

export function ModemModal({
  modem,
  open,
  onOpenChange,
  onCancel,
  onSubmit,
}: ModemModalProps) {
  const [form, setForm] = useState(() => getInitialForm(modem));
  const [showErrors, setShowErrors] = useState(false);
  const isEditing = Boolean(modem);

  useEffect(() => {
    if (!open) return;

    setForm(getInitialForm(modem));
    setShowErrors(false);
  }, [modem, open]);

  const resetForm = () => {
    setForm(emptyForm);
    setShowErrors(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleSubmit = () => {
    const cleanCode = form.code.trim().toUpperCase();
    const cleanName = form.name.trim();
    const hasErrors = !cleanCode || !cleanName;

    setShowErrors(hasErrors);
    if (hasErrors) return;

    onSubmit({
      id: modem?.id ?? `pending-${Date.now()}`,
      code: cleanCode,
      name: cleanName,
      status: form.status,
      updatedAt: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    });

    if (!isEditing) resetForm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-[520px] flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-4rem)]">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
          <DialogTitle className="text-base">
            {isEditing ? "Edit Modem" : "Add Modem"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the modem code, modem name, and current status."
              : "Create a modem record with a code, name, and status."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
            <div className="grid gap-1.5">
              <label
                className="text-[13px] font-medium sm:text-sm"
                htmlFor="modem-code"
              >
                Modem code
              </label>
              <Input
                id="modem-code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                placeholder="MDM-001"
                className="font-mono uppercase"
                aria-invalid={showErrors && !form.code.trim()}
              />
              {showErrors && !form.code.trim() && (
                <p className="text-xs text-destructive">Enter a modem code.</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <label
                className="text-[13px] font-medium sm:text-sm"
                htmlFor="modem-name"
              >
                Modem name
              </label>
              <Input
                id="modem-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="FiberHome HG6245D"
                aria-invalid={showErrors && !form.name.trim()}
              />
              {showErrors && !form.name.trim() && (
                <p className="text-xs text-destructive">Enter a modem name.</p>
              )}
            </div>
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-[13px] font-medium sm:text-sm"
              htmlFor="modem-status"
            >
              Status
            </label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  status: value as ModemStatus,
                }))
              }
            >
              <SelectTrigger
                id="modem-status"
                className="h-10 w-full bg-background/40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modemStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t bg-muted/10 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
