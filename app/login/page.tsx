import { LoginForm } from "@/components/login-form";
import {
  getCurrentMainPermissions,
  getMainLandingPath,
} from "@/lib/access-control";
import { createClient } from "@/lib/supabase/server";
import { Fredoka } from "next/font/google";
import Image from "next/image";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const roundedBrand = Fredoka({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    const permissions = await getCurrentMainPermissions();
    redirect(getMainLandingPath(permissions));
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <Image
              src="/logo.png"
              alt="Access Network logo"
              width={40}
              height={40}
              className="size-10 object-contain"
            />
            Access Network
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-slate-50 dark:bg-zinc-950 lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eef4fb_100%)] dark:bg-[linear-gradient(135deg,#09090b_0%,#0f172a_52%,#111827_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/80 dark:bg-white/10" />
        <div className="absolute inset-y-16 left-16 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent dark:via-white/10" />
        <div className="absolute inset-y-16 right-16 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent dark:via-white/10" />
        <div className="absolute left-24 top-24 grid grid-cols-4 gap-4 opacity-45 dark:opacity-35">
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={index}
              className="size-1.5 rounded-full bg-slate-300 dark:bg-slate-600"
            />
          ))}
        </div>
        <div className="absolute right-24 top-28 h-28 w-56 rounded-full border border-slate-200/80 dark:border-white/10" />
        <div className="absolute bottom-28 right-24 h-40 w-40 rounded-full border border-slate-200/80 dark:border-white/10" />
        <div className="absolute bottom-36 right-32 h-24 w-24 rounded-full border border-blue-200/80 dark:border-blue-400/25" />
        <div className="absolute left-20 top-1/2 h-px w-72 bg-gradient-to-r from-transparent via-blue-300/70 to-transparent dark:via-blue-400/35" />
        <div className="absolute left-36 top-[54%] h-px w-52 bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent dark:via-cyan-400/30" />
        <div className="absolute bottom-20 left-24 grid w-44 gap-3 opacity-55 dark:opacity-35">
          <span className="h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          <span className="h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          <span className="h-1 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="relative flex w-full max-w-[560px] flex-col items-center px-10">
          <Image
            src="/logo.png"
            alt="Access Network logo"
            width={420}
            height={420}
            priority
            className="h-auto w-[420px] dark:brightness-110"
          />
          <div className="mt-9 text-center">
            <h2
              className={`${roundedBrand.className} text-4xl font-bold tracking-wide`}
            >
              <span
                className="text-slate-950"
                style={{
                  textShadow:
                    "1px 0 white, -1px 0 white, 0 1px white, 0 -1px white, 1px 1px white, -1px -1px white, 1px -1px white, -1px 1px white",
                }}
              >
                ACCESS
              </span>{" "}
              <span
                className="text-blue-600"
                style={{
                  textShadow:
                    "1px 0 white, -1px 0 white, 0 1px white, 0 -1px white, 1px 1px white, -1px -1px white, 1px -1px white, -1px 1px white",
                }}
              >
                NETWORK
              </span>
            </h2>
            <p
              className="mt-3 text-2xl text-blue-600 dark:text-blue-300"
              style={{
                fontFamily:
                  '"Magnolia Script", "Brush Script MT", "Segoe Script", cursive',
              }}
            >
              More than just internet
            </p>
            <div className="mx-auto mt-4 h-0.5 w-24 rounded-full bg-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
