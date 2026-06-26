"use client";
import { useEffect } from "react";

// easing que combina com cubic-bezier(0.22,1,0.36,1) usado no site
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function animateScroll(to: number, duration = 680) {
  const start = window.scrollY;
  const distance = to - start;
  let startTime: number | null = null;

  function step(ts: number) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + distance * easeOutExpo(progress));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

export function SmoothScroll() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;

      const hash = anchor.getAttribute("href")?.slice(1) ?? "";

      e.preventDefault();

      if (!hash) {
        animateScroll(0);
        return;
      }

      const target = document.getElementById(hash);
      if (!target) return;

      const navHeight = document.querySelector("nav")?.offsetHeight ?? 60;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;

      animateScroll(top);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
