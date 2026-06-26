# Landing "Vivo" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a landing (`lexo/src/app/page.tsx`) mais viva — fundo animado em camadas, paleta de acento multi-hue e motion de assinatura — sem reescrever a estrutura nem adicionar libs.

**Architecture:** Refatorar o `page.tsx` existente. Toda animação fica no `<style>` inline já presente (string `CSS`) + estilos inline nos elementos. Cor nova vive só em gradientes/glows/auroras; superfícies de card permanecem dark. Um único `useEffect` novo para parallax. Tudo desligável em `prefers-reduced-motion`.

**Tech Stack:** Next.js (App Router), React client component, CSS puro (keyframes + transforms), sem bibliotecas novas.

## Global Constraints

- Não adicionar nenhuma dependência nova (sem canvas/WebGL/libs de animação).
- Não tocar em nenhum arquivo além de `lexo/src/app/page.tsx`.
- Não alterar copy, rotas, dados (`features`, `plans`, `statsData`, `trustNames`) nem estrutura de seções.
- Todas as animações em `transform` / `opacity` / `background-position`.
- Toda animação nova deve ter contrapartida no bloco `@media (prefers-reduced-motion: reduce)`.
- Trabalhar na branch `dev`. Commits atômicos por task.
- Verificação visual roda a partir de `lexo/`: `npm run dev` (porta padrão 3000) → abrir `/`.
- Build de verificação final: `cd lexo && npm run build`.
- Paleta (oklch): `AC` índigo `0.68 0.24 274` (dominante), `AC2` violeta `0.72 0.20 300`, `AC3` azul `0.70 0.20 230`, `AC_CY` ciano `0.74 0.16 200`, `AC_MG` magenta `0.70 0.22 330`.

---

### Task 1: Tokens de cor multi-hue

**Files:**
- Modify: `lexo/src/app/page.tsx` (bloco de tokens, ~linhas 6–14)

**Interfaces:**
- Produces: constantes `AC_CY` e `AC_MG` (strings oklch) usadas pelas tasks 2, 3, 6, 7, 8, 9.

- [ ] **Step 1: Adicionar os dois tokens novos**

Localizar o bloco de tokens e adicionar `AC_CY` e `AC_MG` logo após `AC3`:

```tsx
const AC    = "oklch(0.68 0.24 274)";
const AC2   = "oklch(0.72 0.20 300)";
const AC3   = "oklch(0.70 0.20 230)";
const AC_CY = "oklch(0.74 0.16 200)";
const AC_MG = "oklch(0.70 0.22 330)";
```

- [ ] **Step 2: Verificar que compila**

Run: `cd lexo && npx tsc --noEmit -p tsconfig.json` (ou confiar no dev server já rodando sem erro de "unused var" — os tokens serão usados nas próximas tasks; se o lint reclamar de unused, seguir para Task 2 que os consome antes de commitar).

Expected: sem erros de sintaxe.

- [ ] **Step 3: Commit (junto com Task 2 se houver warning de unused)**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): tokens de cor multi-hue (ciano, magenta)"
```

---

### Task 2: Camada 1 — Aurora multi-hue animada

**Files:**
- Modify: `lexo/src/app/page.tsx` — keyframes `aurora-a/b/c` no bloco `CSS` (~linhas 141–158) e bloco AURORA no JSX (~linhas 466–471)

**Interfaces:**
- Consumes: `AC_CY`, `AC_MG` da Task 1.
- Produces: container `.bg-aurora` (id no JSX via ref `auroraRef`) que a Task 5 (parallax) vai deslocar.

- [ ] **Step 1: Adicionar keyframe `aurora-d` ao bloco CSS**

Após o `@keyframes aurora-c` existente, adicionar:

```css
  @keyframes aurora-d {
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(-20px,-25px) scale(1.05); }
    66%  { transform: translate(25px,15px) scale(0.95); }
    100% { transform: translate(0,0) scale(1); }
  }
```

- [ ] **Step 2: Substituir o bloco AURORA do JSX**

Trocar a `<div>` fixa de aurora (a que contém os 3 `.aurora-blob`) por esta versão com 5 blobs multi-hue e `ref`:

```tsx
{/* ── BG: AURORA (camada 1) ── */}
<div ref={auroraRef} className="bg-aurora" style={{ position: "fixed", inset: "-10% 0 0 0", overflow: "hidden", zIndex: 0, pointerEvents: "none", willChange: "transform" }}>
  <div className="aurora-blob" style={{ position: "absolute", top: "-12%", right: "-6%",  width: 360, height: 420, borderRadius: "50%", background: "oklch(0.50 0.30 274)", filter: "blur(120px)", opacity: 0.26, animation: "aurora-a 35s ease-in-out infinite" }} />
  <div className="aurora-blob" style={{ position: "absolute", top: "16%",  left: "-9%",  width: 320, height: 360, borderRadius: "50%", background: "oklch(0.46 0.28 310)", filter: "blur(120px)", opacity: 0.24, animation: "aurora-b 42s ease-in-out infinite" }} />
  <div className="aurora-blob" style={{ position: "absolute", top: "44%",  left: "44%",  width: 380, height: 300, borderRadius: "50%", background: "oklch(0.50 0.20 200)", filter: "blur(130px)", opacity: 0.20, animation: "aurora-c 30s ease-in-out infinite" }} />
  <div className="aurora-blob" style={{ position: "absolute", top: "68%",  right: "2%",   width: 340, height: 320, borderRadius: "50%", background: "oklch(0.48 0.26 330)", filter: "blur(125px)", opacity: 0.18, animation: "aurora-d 38s ease-in-out infinite" }} />
  <div className="aurora-blob" style={{ position: "absolute", top: "88%",  left: "12%",   width: 360, height: 300, borderRadius: "50%", background: "oklch(0.46 0.24 274)", filter: "blur(130px)", opacity: 0.18, animation: "aurora-b 46s ease-in-out infinite" }} />
</div>
```

- [ ] **Step 3: Declarar o ref**

No topo do componente, junto dos outros refs (~linha 336), adicionar:

```tsx
const auroraRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 4: Verificação visual**

Run: dev server em `lexo/` (`npm run dev`), abrir `http://localhost:3000`.
Expected: 5 manchas de luz coloridas (roxo, violeta, ciano, magenta) se movendo lentamente, cobrindo também a metade inferior da página. Sem barra de scroll horizontal.

- [ ] **Step 5: Commit**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): aurora multi-hue com 5 blobs cobrindo a dobra inferior"
```

---

### Task 3: Camada 2 — Dot grid + beam de luz

**Files:**
- Modify: `lexo/src/app/page.tsx` — bloco `CSS` (novo keyframe `beam-sweep`) e JSX (nova camada após a aurora)

**Interfaces:**
- Consumes: `AC_CY` da Task 1.
- Produces: nada para tasks seguintes (camada autônoma).

- [ ] **Step 1: Adicionar keyframe `beam-sweep` ao bloco CSS**

```css
  @keyframes beam-sweep {
    0%   { transform: translate3d(-40%, -40%, 0) rotate(8deg); opacity: 0; }
    15%  { opacity: 0.6; }
    85%  { opacity: 0.6; }
    100% { transform: translate3d(40%, 40%, 0) rotate(8deg); opacity: 0; }
  }
  .bg-beam {
    position: absolute;
    top: -30%; left: -30%;
    width: 160%; height: 160%;
    background: linear-gradient(115deg, transparent 42%, oklch(0.74 0.16 200 / 0.10) 50%, transparent 58%);
    mix-blend-mode: screen;
    animation: beam-sweep 14s linear infinite;
    will-change: transform, opacity;
  }
```

- [ ] **Step 2: Adicionar a camada dot grid + beam no JSX**

Logo após o `<div ref={auroraRef} ...>` da Task 2, adicionar:

```tsx
{/* ── BG: DOT GRID + BEAM (camada 2) ── */}
<div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
  backgroundImage: "radial-gradient(oklch(1 0 0 / 0.05) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
  WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent 75%)",
  maskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent 75%)" }}>
  <div className="bg-beam" />
</div>
```

- [ ] **Step 3: Verificação visual**

Run: dev server, abrir `/`.
Expected: textura de pontos finos no fundo (mais visível no centro-topo, desvanecendo nas bordas) e uma faixa de luz diagonal atravessando lentamente a cada ~14s.

- [ ] **Step 4: Commit**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): dot grid com beam de luz percorrendo"
```

---

### Task 4: Camada 3 — Vinheta + grão

**Files:**
- Modify: `lexo/src/app/page.tsx` — JSX (nova camada após dot grid)

**Interfaces:**
- Consumes: nada. Produces: nada.

- [ ] **Step 1: Adicionar a camada vinheta + grão no JSX**

Após a camada dot grid da Task 3:

```tsx
{/* ── BG: VINHETA + GRÃO (camada 3) ── */}
<div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
  background: "radial-gradient(ellipse 100% 100% at 50% 30%, transparent 55%, oklch(0.05 0.02 264 / 0.55) 100%)" }} />
<div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.03,
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
```

- [ ] **Step 2: Verificação visual**

Run: dev server, abrir `/`.
Expected: bordas levemente mais escuras (foco no centro) e uma textura de grão sutil sobre tudo, sem deixar o fundo "sujo". Conteúdo continua legível.

- [ ] **Step 3: Commit**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): vinheta de foco + grão sutil no fundo"
```

---

### Task 5: Parallax leve da aurora no scroll

**Files:**
- Modify: `lexo/src/app/page.tsx` — novo `useEffect` junto dos demais (~após o effect de mount do hero)

**Interfaces:**
- Consumes: `auroraRef` da Task 2.
- Produces: nada.

- [ ] **Step 1: Adicionar o effect de parallax**

```tsx
// Parallax leve da aurora
useEffect(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = auroraRef.current;
  if (!el) return;
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      el.style.transform = `translateY(${window.scrollY * 0.08}px)`;
      raf = 0;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
}, []);
```

- [ ] **Step 2: Verificação visual**

Run: dev server, rolar a página.
Expected: as auroras se deslocam de leve (mais devagar que o conteúdo), dando profundidade. Sem travadas no scroll.

- [ ] **Step 3: Commit**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): parallax leve da aurora no scroll"
```

---

### Task 6: Motion assinatura — gradiente fluindo no H1

**Files:**
- Modify: `lexo/src/app/page.tsx` — bloco `CSS` (keyframe + classe) e H1 do hero (~linha 537)

**Interfaces:**
- Consumes: tokens da Task 1 (via valores literais no CSS).
- Produces: classe `.text-flow` reutilizável (Task 7 referencia o mesmo keyframe `gradient-flow`).

- [ ] **Step 1: Adicionar keyframe e classe ao bloco CSS**

```css
  @keyframes gradient-flow {
    0%   { background-position:   0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position:   0% 50%; }
  }
  .text-flow {
    background: linear-gradient(100deg,
      oklch(0.98 0.01 264) 0%,
      oklch(0.74 0.16 200) 30%,
      oklch(0.72 0.20 300) 55%,
      oklch(0.70 0.22 330) 80%,
      oklch(0.98 0.01 264) 100%);
    background-size: 220% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-flow 9s ease-in-out infinite;
  }
```

- [ ] **Step 2: Aplicar `.text-flow` ao H1 do hero**

No `<h1>` do hero, adicionar `className="text-flow"` e remover a cor sólida do `style` (o `background-clip` cuida da cor). Manter os demais estilos (`fontFamily`, `fontSize`, etc.). Resultado:

```tsx
<h1 className="text-flow" style={{ fontFamily: F, fontSize: 64, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-2px", margin: "22px 0 0" }}>
  O sistema que cuida do escritório enquanto você cuida da causa.
</h1>
```

- [ ] **Step 3: Verificação visual**

Run: dev server, abrir `/`.
Expected: o título do hero tem um gradiente colorido (branco→ciano→violeta→magenta) que flui lentamente da esquerda pra direita.

- [ ] **Step 4: Commit**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): H1 do hero com gradiente animado multi-hue"
```

---

### Task 7: Borda gradiente animada — Lexo IA e Stats

**Files:**
- Modify: `lexo/src/app/page.tsx` — bloco `CSS` (classe `.flow-border`) e os containers da seção `#ia` (~linha 727) e Stats (~linha 789)

**Interfaces:**
- Consumes: keyframe `gradient-flow` da Task 6.
- Produces: classe `.flow-border`.

- [ ] **Step 1: Adicionar a classe `.flow-border` ao bloco CSS**

Borda gradiente animada via pseudo-elemento mascarado (não afeta o fundo do card):

```css
  .flow-border {
    position: relative;
  }
  .flow-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(120deg,
      oklch(0.68 0.24 274), oklch(0.74 0.16 200),
      oklch(0.70 0.22 330), oklch(0.68 0.24 274));
    background-size: 220% auto;
    animation: gradient-flow 10s ease-in-out infinite;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.7;
  }
```

- [ ] **Step 2: Aplicar à seção Lexo IA**

No container interno da seção `#ia` (o `<div>` com `borderRadius: 22` e borda de acento), adicionar `className="flow-border"` e remover a `border` estática do `style` (o pseudo cuida da borda). Manter `borderRadius`, `background`, `padding`, grid.

- [ ] **Step 3: Aplicar ao bloco de Stats**

O bloco de stats hoje usa `borderTop`. Envolver a grade num container com `borderRadius: 18`, `padding: 32`, `className="flow-border"`, removendo o `borderTop`/`paddingTop` antigo. Estrutura:

```tsx
<div ref={statsRef} data-reveal="" className="flow-border" style={{ borderRadius: 18, padding: "40px 32px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
  {/* ...statsData.map mantém-se igual, mas remover o borderRight do último e ajustar para o novo padding... */}
</div>
```

(Manter o `.map` de `statsData` e os `statValueRefs`; só o wrapper muda.)

- [ ] **Step 4: Verificação visual**

Run: dev server, abrir `/`.
Expected: a caixa da seção "Lexo IA" e a caixa dos números (Stats) têm uma borda fina com gradiente colorido que flui. O fundo interno dos cards permanece dark. Count-up dos números continua funcionando.

- [ ] **Step 5: Commit**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): borda gradiente animada em Lexo IA e Stats"
```

---

### Task 8: Ícones de feature multi-hue

**Files:**
- Modify: `lexo/src/app/page.tsx` — bloco de dados `features` (~linha 17) e os dois `.map` de feature cards (~linhas 686 e 705)

**Interfaces:**
- Consumes: tokens da Task 1.
- Produces: campo `hue` em cada item de `features`.

- [ ] **Step 1: Adicionar um `hue` por feature**

Em cada objeto de `features`, adicionar uma propriedade `hue` com um dos tokens, rotacionando a paleta:

```tsx
// Gestão de processos →  hue: AC
// Prazos & agenda     →  hue: AC3
// Lexo IA             →  hue: AC2
// Jurimetria          →  hue: AC_CY
// Financeiro          →  hue: AC_MG
// Portal do cliente   →  hue: AC3
```

(Adicionar `hue: AC,` etc. a cada objeto. Os tokens já estão no escopo do módulo.)

- [ ] **Step 2: Usar `hue` no badge do ícone**

Nos dois `.map` (row de 2 cards e row de 4 cards), trocar as referências de cor do ícone de `AC` para `hue` desestruturado do item. Ex.: `{ title, novo, desc, icon, hue }` e no `<span>` do ícone:

```tsx
style={{ /* ... */ color: hue, background: `color-mix(in oklab,${hue} 13%,transparent)`, border: `1px solid color-mix(in oklab,${hue} 22%,transparent)` }}
```

(O glow de hover `.feature-card::before` pode permanecer índigo — é sutil — ou, opcionalmente, nada muda ali.)

- [ ] **Step 3: Verificação visual**

Run: dev server, abrir `/`.
Expected: cada card de recurso tem o ícone numa cor diferente (índigo, azul, violeta, ciano, magenta), dando variedade sem chapar os cards.

- [ ] **Step 4: Commit**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): ícones de feature com hue próprio (multi-hue)"
```

---

### Task 9: Glow multi-hue — pricing popular e CTA final

**Files:**
- Modify: `lexo/src/app/page.tsx` — card popular do pricing (~linha 867) e orbs do CTA final (~linhas 899–901)

**Interfaces:**
- Consumes: tokens da Task 1.

- [ ] **Step 1: Glow multi-hue no card popular**

No `boxShadow` do card `plan.popular`, substituir o glow índigo único por um glow de dois hues:

```tsx
boxShadow: plan.popular
  ? `0 0 60px color-mix(in oklab,${AC} 20%,transparent), 0 0 120px color-mix(in oklab,${AC_MG} 12%,transparent)`
  : "none",
```

- [ ] **Step 2: Orbs multi-hue no CTA final**

Nos dois orbs internos do CTA final, trocar o `radial-gradient` de uma cor para gradientes de hues distintos:

```tsx
{/* outer */}
background: `radial-gradient(closest-side, color-mix(in oklab,${AC} 18%,transparent), transparent)`,
{/* inner (pulsante) */}
background: `radial-gradient(closest-side, color-mix(in oklab,${AC_MG} 26%,transparent), transparent)`,
```

(Manter a animação `glow-pulse` no orb interno.)

- [ ] **Step 3: Verificação visual**

Run: dev server, abrir `/`.
Expected: o card "MAIS POPULAR" tem um halo com toque magenta além do índigo; o bloco do CTA final mistura índigo e magenta no brilho central pulsante.

- [ ] **Step 4: Commit**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): glow multi-hue no pricing popular e CTA final"
```

---

### Task 10: Passe final de reduced-motion + build

**Files:**
- Modify: `lexo/src/app/page.tsx` — bloco `@media (prefers-reduced-motion: reduce)` no `CSS` (~linhas 324–331)

**Interfaces:**
- Consumes: todas as classes/keyframes criados.

- [ ] **Step 1: Estender o bloco reduced-motion**

Garantir que o bloco existente desligue também as animações novas. Versão final:

```css
  @media (prefers-reduced-motion: reduce) {
    .aurora-blob { animation: none !important; }
    .bg-beam { animation: none !important; opacity: 0 !important; }
    .text-flow { animation: none !important; }
    .flow-border::before { animation: none !important; }
    [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
    .marquee-inner { animation: none !important; }
    .hero-panel, .hero-card { opacity: 1 !important; transform: none !important; transition: none !important; }
    .badge-pulse::after, .live-dot::before, .badge-shimmer::after,
    .cursor-blink, .chat-item-late { animation: none !important; opacity: 1 !important; }
  }
```

(O `.text-flow` sem animação mantém o gradiente estático no `background-position` inicial — texto continua legível e colorido.)

- [ ] **Step 2: Verificar reduced-motion**

Run: dev server; nas DevTools, Rendering → "Emulate CSS prefers-reduced-motion: reduce".
Expected: auroras param, beam some, gradientes param (estáticos), texto e bordas continuam legíveis e coloridos. Parallax não atua (o effect retorna cedo).

- [ ] **Step 3: Build de produção**

Run: `cd lexo && npm run build`
Expected: build conclui sem erros de TypeScript/lint relacionados à página.

- [ ] **Step 4: Commit**

```bash
git add lexo/src/app/page.tsx
git commit -m "feat(landing): reduced-motion cobre auroras, beam e gradientes; build ok"
```

---

## Self-Review

**Spec coverage:**
- §1 Tokens → Task 1 ✓
- §2 Camada 1 aurora → Task 2 ✓ ; Camada 2 grid+beam → Task 3 ✓ ; Camada 3 vinheta+grão → Task 4 ✓ ; Parallax → Task 5 ✓
- §3 Motion assinatura (H1, borda Lexo IA, Stats, pricing) → Tasks 6, 7, 9 ✓
- §4 Cor por seção (ícones de feature, pricing, CTA) → Tasks 8, 9 ✓
- §5 Acessibilidade/performance → Task 10 + checagens `matchMedia` nas tasks 5 ✓
- §6 Escopo/YAGNI → Global Constraints (sem libs, só page.tsx) ✓

**Placeholder scan:** sem TBD/TODO; todo passo com código concreto.

**Type consistency:** `auroraRef` definido na Task 2 e consumido na Task 5; keyframe `gradient-flow` definido na Task 6 e reusado na Task 7; campo `hue` adicionado na Task 8 e consumido no mesmo task; tokens `AC_CY`/`AC_MG` definidos na Task 1 e usados em 2/6/7/8/9.

---

## Execution Handoff

Após salvar, escolher modo de execução (subagent-driven recomendado ou inline).
