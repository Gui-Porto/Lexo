import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { isPaidPlan, isTrialExpired, daysLeftInTrial } from "@/lib/billing";

export async function TrialBanner({ organizationId }: { organizationId: string }) {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, trialEndsAt: true },
  });

  if (!org || isPaidPlan(org.plan)) return null;

  const expired = isTrialExpired(org.plan, org.trialEndsAt);
  const daysLeft = daysLeftInTrial(org.trialEndsAt);

  if (expired) {
    return (
      <div
        className="mb-6 flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm"
        style={{
          background: "oklch(0.35 0.18 25 / 0.25)",
          border: "1px solid oklch(0.55 0.2 25 / 0.4)",
          color: "oklch(0.85 0.1 25)",
        }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Seu período de trial expirou. Assine um plano para continuar usando o Lexo.</span>
        </div>
        <Link
          href="/planos"
          className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: "oklch(0.55 0.2 25 / 0.7)", color: "#fff" }}
        >
          Ver planos
        </Link>
      </div>
    );
  }

  if (daysLeft <= 7) {
    return (
      <div
        className="mb-6 flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm"
        style={{
          background: "oklch(0.42 0.17 60 / 0.2)",
          border: "1px solid oklch(0.65 0.15 60 / 0.35)",
          color: "oklch(0.85 0.1 60)",
        }}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            {daysLeft === 0
              ? "Seu trial expira hoje."
              : `Seu trial expira em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}.`}
          </span>
        </div>
        <Link
          href="/planos"
          className="shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: "oklch(0.65 0.15 60 / 0.5)", color: "#fff" }}
        >
          Assinar agora
        </Link>
      </div>
    );
  }

  return (
    <div
      className="mb-6 flex items-center justify-between gap-4 rounded-xl px-4 py-2.5 text-sm"
      style={{
        background: "oklch(0.66 0.18 274 / 0.08)",
        border: "1px solid oklch(0.66 0.18 274 / 0.2)",
        color: "oklch(0.75 0.1 274)",
      }}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>Trial gratuito · {daysLeft} dias restantes</span>
      </div>
      <Link
        href="/planos"
        className="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity underline underline-offset-2"
      >
        Ver planos
      </Link>
    </div>
  );
}
