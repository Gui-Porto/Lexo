export type Plan = "trial" | "essencial" | "pro";

export const PLAN_LIMITS = {
  trial: {
    maxUsers: 3,
    maxProcessos: 10,
    canUseAI: false,
    canUsePortalCliente: false,
    canUseMinutas: false,
    canUseJurimetria: false,
    canUseResumoIA: false,
    canAccessRelatorios: false,
    label: "Trial",
    userLimitLabel: "3 usuários (Trial)",
  },
  essencial: {
    maxUsers: 5,
    maxProcessos: Infinity,
    canUseAI: false,
    canUsePortalCliente: true,
    canUseMinutas: false,
    canUseJurimetria: false,
    canUseResumoIA: false,
    canAccessRelatorios: true,
    label: "Essencial",
    userLimitLabel: "5 usuários (Essencial)",
  },
  pro: {
    maxUsers: Infinity,
    maxProcessos: Infinity,
    canUseAI: true,
    canUsePortalCliente: true,
    canUseMinutas: true,
    canUseJurimetria: true,
    canUseResumoIA: true,
    canAccessRelatorios: true,
    label: "Pro",
    userLimitLabel: "Usuários ilimitados (Pro)",
  },
} as const;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.trial;
}

export function canInviteMoreUsers(plan: string, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxUsers === Infinity) return true;
  return currentCount < limits.maxUsers;
}

export function usersRemainingInPlan(plan: string, currentCount: number): number {
  const limits = getPlanLimits(plan);
  if (limits.maxUsers === Infinity) return Infinity;
  return Math.max(0, limits.maxUsers - currentCount);
}
