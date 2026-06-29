"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function ManagerViewPage() {
  const router = useRouter();
  const pullAmountRef = React.useRef(0);
  const pullResetRef = React.useRef<number | null>(null);
  const isNavigatingRef = React.useRef(false);
  const [pullProgress, setPullProgress] = React.useState(0);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.scrollingElement?.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, []);

  React.useEffect(() => {
    const goToDashboard = () => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      router.push("/main/overview");
    };

    const resetPull = () => {
      pullAmountRef.current = 0;
      setPullProgress(0);
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY >= 0) {
        resetPull();
        return;
      }

      const scrollTop = document.scrollingElement?.scrollTop ?? window.scrollY;

      if (scrollTop > 2) {
        resetPull();
        return;
      }

      event.preventDefault();
      pullAmountRef.current = Math.min(
        140,
        pullAmountRef.current + Math.abs(event.deltaY) * 0.45,
      );
      setPullProgress(pullAmountRef.current / 140);

      if (pullResetRef.current) {
        window.clearTimeout(pullResetRef.current);
      }

      pullResetRef.current = window.setTimeout(resetPull, 220);

      if (pullAmountRef.current < 140) return;

      window.setTimeout(goToDashboard, 120);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (pullResetRef.current) {
        window.clearTimeout(pullResetRef.current);
      }
    };
  }, [router]);

  return (
    <main className="min-h-full bg-muted/25">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1600px] items-center px-4 py-4 sm:p-6 lg:min-h-[calc(100svh-3rem)] lg:p-8">
        <section className="w-full rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">
              Overview
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Manager View
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              A focused management summary will appear here. Use this space for
              branch performance, team activity, escalations, and other
              high-level operational insights.
            </p>
          </div>
        </section>
      </div>
      {pullProgress > 0 && (
        <div
          className="pointer-events-none fixed inset-x-0 top-20 z-50 mx-auto flex w-fit flex-col items-center gap-2 rounded-full border bg-background/90 px-4 py-3 text-xs font-medium text-foreground shadow-lg backdrop-blur"
          style={{
            transform: `translateY(-${(1 - pullProgress) * 18}px)`,
            opacity: Math.max(0.35, pullProgress),
          }}
        >
          <span>
            {pullProgress >= 1 ? "Release to Dashboard" : "Pull for Dashboard"}
          </span>
          <span className="h-1 w-28 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${Math.min(100, pullProgress * 100)}%` }}
            />
          </span>
        </div>
      )}
    </main>
  );
}
