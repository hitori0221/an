"use client";

import { useActionState } from "react";

import { login } from "@/app/login/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form
      action={formAction}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue="demo@gmail.com"
            placeholder="m@example.com"
            autoComplete="email"
            required
            className="bg-background"
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            defaultValue="12345678"
            autoComplete="current-password"
            required
            className="bg-background"
          />
        </Field>
        {state?.error && (
          <FieldError className="text-center">{state.error}</FieldError>
        )}
        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Logging in..." : "Login"}
          </Button>
        </Field>
        <FieldDescription className="text-center">
          Enter the email and password provided by your administrator.
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
