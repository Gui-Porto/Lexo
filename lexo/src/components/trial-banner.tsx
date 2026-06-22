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
      <div className="bg-destructive/10 border-destructive/30 text-destructive mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Seu período de trial expirou. Assine um plano para continuar usando o Lexo.</span>
        </div>
        <Link
          href="/planos"
          className="bg-destructive shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  if (daysLeft <= 7) {
    return (
      <div className="bg-warning/10 border-warning/30 text-warning mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm">
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
          className="bg-warning shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80"
        >
          Assinar agora
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-brand/8 border-brand/20 text-brand mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5 text-sm">
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
