# Landing "Vivo" — Redesign Visual (fundo animado + multi-hue)

**Data:** 2026-06-26
**Arquivo-alvo:** `lexo/src/app/page.tsx` (refatorar, não reescrever)
**Status:** Aprovado para implementação após revisão do spec

---

## Objetivo

Tornar a landing page **mais viva**: fundo animado perceptível, paleta de
acento ampliada (multi-hue) e mais momentos de movimento — mantendo a sobriedade
exigida por um produto jurídico (público conservador).

A estrutura de seções atual já foi aprovada anteriormente e **não muda**. O que
muda é a **fundação visual** (fundo, cor, motion). Refatoramos o `page.tsx`
existente preservando: nav com pill animada, scroll-reveal, count-up de stats,
acessibilidade `prefers-reduced-motion`.

### Decisões do usuário
- **Direção de cor:** Multi-hue sofisticado — dark premium, acento ampliado
  (índigo → violeta → ciano → magenta) vivendo na luz (gradientes/glows/auroras),
  nunca em blocos chapados.
- **Fundo:** Aurora colorida animada + dot grid por cima (combinação). Fundo
  animado é **prioridade explícita** — o movimento deve ser perceptível.

---

## 1. Tokens de cor (ampliar paleta de acento)

Adicionar aos tokens existentes no topo de `page.tsx`:

```
const AC    = "oklch(0.68 0.24 274)";  // índigo  (existente — primário)
const AC2   = "oklch(0.72 0.20 300)";  // violeta (existente)
const AC3   = "oklch(0.70 0.20 230)";  // azul    (existente)
const AC_CY = "oklch(0.74 0.16 200)";  // NOVO — ciano
const AC_MG = "oklch(0.70 0.22 330)";  // NOVO — magenta
```

**Regra de uso:** `AC` (índigo) continua o acento dominante (CTAs, badges, estado
ativo). Os demais hues aparecem só em **gradientes, glows e auroras** — para dar
cor sem comprometer a seriedade. Superfícies de card permanecem dark.

---

## 2. Sistema de fundo (3 camadas, `position: fixed`, atrás de tudo)

Substitui o bloco AURORA atual (linhas ~466–471). Container fixo,
`pointer-events: none`, `zIndex: 0`.

### Camada 1 — Aurora viva (multi-hue)
- 4–5 blobs de gradiente radial (hoje são 3), agora cobrindo os 5 hues.
- Cada blob: `filter: blur(120px)`, `opacity` 0.18–0.26, animação própria
  (`aurora-a/b/c/d`) de 28–42s, `ease-in-out infinite`, com `translate` + `scale`.
- Distribuídos em topo-direita, meio-esquerda, base-centro + 1–2 extras para
  cobrir a dobra inferior (hoje a página perde cor no fim).

### Camada 2 — Dot grid com beam
- Dot grid: `background-image: radial-gradient(1px dots)`, célula ~32px,
  `opacity ~5%`, com `mask-image` radial que desvanece nas bordas.
- **Beam:** uma faixa de luz (linear-gradient transparente→acento→transparente)
  que percorre o grid lentamente via `@keyframes` (translate diagonal, ~14s),
  dando sensação de "energia fluindo". `mix-blend-mode: screen`, opacity baixa.

### Camada 3 — Vinheta + grão
- Vinheta: `radial-gradient` escuro nas bordas (foco no centro).
- Grão: noise SVG (`feTurbulence`) como data-URI, `opacity ~3%`, fixo. Tira o
  aspecto "liso digital".

### Parallax leve
- No scroll, deslocar a camada de aurora em `translateY` proporcional a
  `window.scrollY` (fator ~0.05–0.1) via listener com `requestAnimationFrame`.
  O fundo nunca parece estático. Desligado em reduced-motion.

---

## 3. Motion "assinatura" (gradiente fluindo)

Novo keyframe `gradient-flow` (anima `background-position` de um gradiente
linear/conic com os hues). Aplicado em:
- **H1 do hero** — texto com gradiente animado índigo→ciano→magenta lento.
- **Borda do container "Lexo IA"** — borda gradiente animada (técnica
  `border` via `padding-box`/`background-clip` ou pseudo-elemento com máscara).
- **Borda do bloco de Stats** — idem, sutil.
- **Card "MAIS POPULAR"** do pricing — glow colorido pulsante (já tem glow;
  trocar para multi-hue + pulse).

Manter o que já funciona: glow seguindo o mouse nos `.feature-card`, `.cta-btn`
com brilho percorrendo, badge pulse, marquee, count-up.

---

## 4. Cor por seção (sem chapar)

| Seção | Mudança visual |
|-------|----------------|
| Fundo global | Substituir aurora de 3 blobs → sistema de 3 camadas (acima). |
| Nav | Mantém pill. Logo mark com leve gradiente multi-hue. |
| Hero | H1 gradiente animado. Glow do mockup → radial multi-hue. Badge pulse. |
| Trust bar | Inalterado (marquee). |
| Features | Cada ícone recebe um hue da paleta (rotação índigo/violeta/ciano/azul/magenta) em vez de todos índigo. Glow de hover mantém. |
| Lexo IA | Borda do container = gradiente animado. Aurora local mais intensa. |
| Portal | Inalterado estruturalmente; herda o fundo animado. |
| Stats | Borda do bloco = gradiente animado sutil. Números mantêm gradiente. |
| Pricing | Card popular: glow multi-hue pulsante. |
| CTA final | Orbs internos → multi-hue; botão primário com gradiente animado. |
| Footer | Inalterado. |

---

## 5. Acessibilidade e performance (não-negociável)

- Todas as animações em `transform`/`opacity`/`background-position` (compositáveis).
- `will-change` aplicado com parcimônia só onde anima continuamente.
- Bloco `@media (prefers-reduced-motion: reduce)` estendido para desligar:
  auroras, beam, parallax, gradient-flow, glow-pulse — caindo para estado
  estático legível. (A disciplina já existe no código; só estender.)
- Beam e parallax só montam após checar `matchMedia("(prefers-reduced-motion)")`.
- Sem libs novas: tudo CSS + o mínimo de JS (parallax) que já segue o padrão
  dos `useEffect` existentes.

---

## 6. Escopo / o que NÃO fazer (YAGNI)

- Não reescrever a página do zero — refatorar `page.tsx`.
- Não adicionar canvas/WebGL nem bibliotecas de animação.
- Não mudar copy, estrutura de seções, rotas ou dados.
- Não tocar em outros arquivos além de `page.tsx` (e, se necessário, um keyframe
  global; preferir manter tudo no `<style>` inline já existente na página).

---

## Critérios de sucesso

1. O fundo tem movimento perceptível e contínuo (aurora respira + beam percorre +
   parallax no scroll), mas não compete com a leitura do conteúdo.
2. A paleta aparece visivelmente mais rica (multi-hue) sem que nenhuma superfície
   de card vire um bloco de cor chapado — mantém o ar "premium/sério".
3. `prefers-reduced-motion` entrega uma versão estática totalmente legível.
4. Nenhuma regressão nas interações existentes (nav pill, reveals, count-up,
   hover dos cards).
5. Sem libs novas; build passa.
