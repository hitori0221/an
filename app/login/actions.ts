"use server";

import { redirect } from "next/navigation";

import {
  getCurrentMainPermissions,
  getMainLandingPath,
} from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

export async function login(
  _state: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const permissions = await getCurrentMainPermissions();
  redirect(getMainLandingPath(permissions));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
