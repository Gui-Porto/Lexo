export const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  essencial: "Essencial",
  pro: "Pro",
};

export function isPaidPlan(plan: string): boolean {
  return plan === "essencial" || plan === "pro";
}

export function isTrialExpired(plan: string, trialEndsAt: Date | null): boolean {
  if (plan !== "trial") return false;
  if (!trialEndsAt) return true;
  return trialEndsAt < new Date();
}

export function daysLeftInTrial(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const ms = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
