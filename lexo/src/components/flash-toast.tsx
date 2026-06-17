"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const message = params.get("toast");
    const type = params.get("toastType") ?? "success";
    if (!message) return;

    if (type === "error") toast.error(message);
    else if (type === "info") toast.info(message);
    else toast.success(message);

    const next = new URLSearchParams(params.toString());
    next.delete("toast");
    next.delete("toastType");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [params, pathname, router]);

  return null;
}
