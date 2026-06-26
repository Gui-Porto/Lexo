# Landing Page — Premium Dark SaaS Redesign

**Date:** 2026-06-25  
**Status:** Approved → Implementation

## Goal

Refinar a LP do Lexo para transmitir sofisticação e autoridade para o mercado jurídico. Direção: Premium Dark SaaS (Linear/Vercel/Resend), sem noise visual, mais breathing room, animações quase imperceptíveis.

## Animation Changes

| Element | Before | After |
|---|---|---|
| Nav pill easing | `cubic-bezier(0.34,1.56,0.64,1)` (spring/overshoot) | `cubic-bezier(0.22, 1, 0.36, 1)` (smooth decelerate) |
| Nav pill duration | 320ms | 380ms |
| Hero panel slide | translateX(60px), ease-out, 700ms | translateX(20px), cubic(0.22,1,0.36,1), 900ms |
| Hero card slide | translateY(30px), 600ms | translateY(14px), 750ms |
| Scroll reveals | translateY(24px) | translateY(12px) |

## Visual Atmosphere

- Aurora opacity: `0.55 → 0.25` (muito menos invasiva)
- Aurora blur: `90px → 120px` (mais difusa)
- Nav backdrop blur: `14px → 20px` (vidro mais premium)

## Layout

- Feature grid: 2 featured cards (50/50) no topo + 4 cards menores (25% cada) abaixo
- Stats section: padding aumentado, thin border-top acima de cada número
- Section padding: `72px → 104px` em todas as seções
- Labels de seção: `letter-spacing: 2.5px`
