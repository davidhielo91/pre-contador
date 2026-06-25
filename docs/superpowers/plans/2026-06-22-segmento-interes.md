# Segmento de Interés (A/B/C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automatic A/B/C engagement classification (`segmentoInteres`) to every lead, with manual override in the CRM.

**Architecture:** New nullable `segmentoInteres` field on the Lead model. Calculated at lead-creation time in `classification.ts` using existing form fields (objetivo, situacion length, semanas cotizadas). Displayed as a badge in the leads table and lead detail. Overridable via the existing PATCH update route.

**Tech Stack:** Prisma (SQLite local / PostgreSQL prod), Next.js 16 App Router, Tailwind CSS, TypeScript.

---

## Files to touch

| File | Change |
|---|---|
| `prisma/schema.sqlite.prisma` | Add `segmentoInteres String?` |
| `prisma/schema.prisma` | Same |
| `src/lib/constants.ts` | Add `SEGMENTOS_INTERES` array + `SEGMENTO_INTERES_COLORS` map |
| `src/lib/classification.ts` | Add `clasificarSegmentoInteres()` + wire into `crearLeadConClasificacion` |
| `src/app/api/leads/[id]/update/route.ts` | Add `segmentoInteres` to `ALLOWED_FIELDS` |
| `src/components/leads/leads-table.tsx` | Add field to interface, badge in row, filter dropdown |
| `src/components/leads/lead-detail.tsx` | Add field to interface, badge display, manual override select |

---

## Task 1: Schema — add `segmentoInteres` field

**Files:**
- Modify: `prisma/schema.sqlite.prisma`
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add field to SQLite schema**

In `prisma/schema.sqlite.prisma`, after `resumenIA String?` (line ~52) add:

```prisma
  segmentoInteres     String?
```

The Lead model block should look like:
```prisma
   vecesRecibido       Int      @default(1)
   resumenIA           String?
   segmentoInteres     String?
   createdAt           DateTime @default(now())
```

- [ ] **Step 2: Add field to active schema**

In `prisma/schema.prisma`, add the same line in the same position.

- [ ] **Step 3: Apply schema to local DB**

```bash
npm run db:push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.sqlite.prisma prisma/schema.prisma
git commit -m "feat: add segmentoInteres field to Lead schema"
```

---

## Task 2: Constants — segment arrays and color map

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add constants after the `ESTADO_COLORS` block**

At the end of `src/lib/constants.ts`, append:

```typescript
export const SEGMENTOS_INTERES = ["A", "B", "C"] as const;

export const SEGMENTO_INTERES_COLORS: Record<string, string> = {
  "A": "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800",
  "B": "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800",
  "C": "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/40 dark:border-slate-700",
};

export const SEGMENTO_INTERES_LABELS: Record<string, string> = {
  "A": "Grupo A — Listo para comprar",
  "B": "Grupo B — Interesado con dudas",
  "C": "Grupo C — Curioso",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add SEGMENTOS_INTERES constants and color maps"
```

---

## Task 3: Classification logic

**Files:**
- Modify: `src/lib/classification.ts`

- [ ] **Step 1: Add `clasificarSegmentoInteres` function**

In `src/lib/classification.ts`, import the new constants by updating the import line at the top:

```typescript
import {
  LANDING_URL,
  SCORE_UMBRAL_FUERTE,
  SCORE_UMBRAL_REVISAR,
  PENSION_MINIMA_GARANTIZADA,
  ETIQUETAS_SCORE,
  CATEGORIAS_INTERNAS,
  ESTADOS_TERMINALES,
} from "./constants";
```

(No change needed — these constants are already imported; `SEGMENTOS_INTERES` is not needed at runtime here.)

Add this new function **after** `clasificarLead` (around line 118), before `extraerMontoPension`:

```typescript
const OBJETIVOS_ESPECIFICOS_A = [
  "Saber cuánto podría recibir",
  "Revisar una pensión baja",
  "Modalidad 40",
  "Modalidad 10",
];

export function clasificarSegmentoInteres(input: LeadInput): string {
  const objetivo = input.objetivoPrincipal ?? "";
  const situacion = input.situacion ?? "";

  const objetivoEspecifico = OBJETIVOS_ESPECIFICOS_A.includes(objetivo);
  const tieneSemanas = input.tieneSemanasCotizadas === "si";
  const situacionDetallada = situacion.length >= 40;
  const objetivoVago = !objetivo || objetivo === "No estoy seguro";
  const situacionCorta = situacion.length < 20;

  // A: objetivo claro Y (tiene semanas cotizadas O describió bien su caso)
  if (objetivoEspecifico && (tieneSemanas || situacionDetallada)) {
    return "A";
  }

  // C: sin objetivo claro O descripción mínima
  if (objetivoVago || situacionCorta) {
    return "C";
  }

  // B: interesado pero con dudas
  return "B";
}
```

- [ ] **Step 2: Wire into `crearLeadConClasificacion`**

In `crearLeadConClasificacion`, right after `const scoreResult = calcularScoreViabilidad(...)` (around line 306), add:

```typescript
const segmentoInteres = clasificarSegmentoInteres(input);
```

Then in the `prisma.lead.create({ data: { ... } })` block, add `segmentoInteres` to the data object (after `etiquetaViabilidad`):

```typescript
scoreViabilidad: scoreResult.score,
etiquetaViabilidad: scoreResult.etiqueta,
segmentoInteres,
```

- [ ] **Step 3: Update the classification activity log**

In the `leadActivity` for `clasificacion_automatica` (around line 349), update the `nota` string to include segmento:

```typescript
nota: `Clasificado como: ${clasificacion.categoria} | Prioridad: ${clasificacion.prioridad} | Viabilidad: ${clasificacion.viabilidad} | Score: ${scoreResult.score} (${scoreResult.etiqueta}) | Segmento: ${segmentoInteres}`,
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/classification.ts
git commit -m "feat: add clasificarSegmentoInteres() and wire into lead creation"
```

---

## Task 4: Update route — allow segmentoInteres override

**Files:**
- Modify: `src/app/api/leads/[id]/update/route.ts`

- [ ] **Step 1: Add field to allowlist**

In `src/app/api/leads/[id]/update/route.ts`, update `ALLOWED_FIELDS`:

```typescript
const ALLOWED_FIELDS = [
  "categoria",
  "prioridad",
  "viabilidad",
  "estadoLead",
  "userId",
  "notasInternas",
  "fechaProximaAccion",
  "segmentoInteres",
];
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/leads/[id]/update/route.ts
git commit -m "feat: allow segmentoInteres in lead update route"
```

---

## Task 5: Leads table — badge and filter

**Files:**
- Modify: `src/components/leads/leads-table.tsx`

- [ ] **Step 1: Update interface and imports**

At the top of `src/components/leads/leads-table.tsx`, update the import from `@/lib/constants` to include the new maps:

```typescript
import {
  PRIORIDADES,
  FUENTES,
  PRIORIDAD_COLORS,
  ESTADO_COLORS,
  SCORE_COLORS,
  SEGMENTOS,
  SEGMENTOS_INTERES,
  SEGMENTO_INTERES_COLORS,
} from "@/lib/constants";
```

Update the `LeadWithUser` interface to add the new field:

```typescript
interface LeadWithUser {
  id: string;
  nombre: string;
  edad: number;
  temaInteres: string;
  fuente: string | null;
  categoria: string;
  prioridad: string;
  estadoLead: string;
  createdAt: Date;
  scoreViabilidad: number | null;
  etiquetaViabilidad: string | null;
  fechaUltimoContacto: Date | null;
  vecesRecibido: number;
  segmentoInteres: string | null;
}
```

- [ ] **Step 2: Add filter dropdown**

Find the existing filters section in the `LeadsTable` component JSX (the row of `<Select>` dropdowns). Add a new `<Select>` for segmento **after** the `fuente` filter:

```tsx
{/* Filtro: Grupo A/B/C */}
<Select
  value={searchParams.get("segmentoInteres") ?? ""}
  onValueChange={(v) => {
    const p = new URLSearchParams(searchParams.toString());
    if (v) p.set("segmentoInteres", v); else p.delete("segmentoInteres");
    p.delete("pagina");
    router.push(`/leads?${p.toString()}`);
  }}
>
  <SelectTrigger className="h-8 text-xs w-[120px]">
    <SelectValue placeholder="Grupo" />
  </SelectTrigger>
  <SelectContent>
    {SEGMENTOS_INTERES.map((s) => (
      <SelectItem key={s} value={s} className="text-xs">
        Grupo {s}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

Also add `segmentoInteres` to `FILTER_LABELS`:
```typescript
const FILTER_LABELS: Record<string, string> = {
  estado: "Estado",
  categoria: "Categoría",
  prioridad: "Prioridad",
  fuente: "Fuente",
  segmento: "Segmento",
  sinContacto: "Sin contacto",
  segmentoInteres: "Grupo",
};
```

- [ ] **Step 3: Add badge in table row**

In the table row JSX, find where the `scoreViabilidad` / `etiquetaViabilidad` badge is shown, and add the segmento badge next to it:

```tsx
{lead.segmentoInteres && (
  <Badge
    variant="outline"
    className={`text-[10px] px-1.5 py-0 font-semibold ${SEGMENTO_INTERES_COLORS[lead.segmentoInteres] ?? ""}`}
  >
    {lead.segmentoInteres}
  </Badge>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/leads/leads-table.tsx
git commit -m "feat: show segmentoInteres badge and filter in leads table"
```

---

## Task 6: Leads page — pass filter to DB query

**Files:**
- Modify: `src/app/(app)/leads/page.tsx`

- [ ] **Step 1: Add `segmentoInteres` to searchParams type**

Update the `PageProps` `searchParams` type:

```typescript
interface PageProps {
  searchParams: Promise<{
    tab?: string;
    estado?: string;
    categoria?: string;
    prioridad?: string;
    fuente?: string;
    busqueda?: string;
    pagina?: string;
    segmento?: string;
    sinContacto?: string;
    orden?: string;
    segmentoInteres?: string;
  }>;
}
```

- [ ] **Step 2: Apply filter in `getLeads`**

In the `getLeads` function, after the `fuente` filter (around line 41), add:

```typescript
if (filters.segmentoInteres) where.segmentoInteres = filters.segmentoInteres;
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/leads/page.tsx
git commit -m "feat: add segmentoInteres filter to leads page query"
```

---

## Task 7: Lead detail — display and manual override

**Files:**
- Modify: `src/components/leads/lead-detail.tsx`

- [ ] **Step 1: Update imports and interface**

Add to the import from `@/lib/constants`:

```typescript
import {
  ESTADOS_LEAD,
  PRIORIDAD_COLORS,
  CATEGORIAS_INTERNAS,
  PRIORIDADES,
  VIABILIDADES,
  ESTADO_COLORS,
  SEGMENTOS_INTERES,
  SEGMENTO_INTERES_COLORS,
  SEGMENTO_INTERES_LABELS,
} from "@/lib/constants";
```

Add `segmentoInteres` to the `LeadDetailProps` lead interface:

```typescript
interface LeadDetailProps {
  lead: {
    // ... existing fields ...
    resumenIA: string | null;
    segmentoInteres: string | null;
    createdAt: Date;
    // ...
  };
}
```

- [ ] **Step 2: Add state for optimistic update**

Inside the `LeadDetail` component function, add state for the segment:

```typescript
const [segmento, setSegmento] = useState(lead.segmentoInteres ?? "");
```

- [ ] **Step 3: Add segment section in the classification card**

Find the section where `categoria`, `prioridad`, and `viabilidad` are shown (the classification/reclassification area). Add the segment selector below them, following the same PATCH pattern:

```tsx
{/* Segmento de interés */}
<div className="space-y-1.5">
  <label className="text-xs font-medium text-muted uppercase tracking-wider">
    Grupo de interés
  </label>
  <Select
    value={segmento}
    onValueChange={async (value) => {
      setSegmento(value);
      await fetch(`/api/leads/${lead.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentoInteres: value }),
      });
      router.refresh();
    }}
  >
    <SelectTrigger className="h-8 text-xs">
      <SelectValue placeholder="Sin clasificar">
        {segmento ? (
          <span className={`inline-flex items-center gap-1.5 font-medium ${SEGMENTO_INTERES_COLORS[segmento] ?? ""}`}>
            <span className="font-bold">Grupo {segmento}</span>
            <span className="text-[10px] opacity-75">
              — {segmento === "A" ? "Listo para comprar" : segmento === "B" ? "Interesado con dudas" : "Curioso"}
            </span>
          </span>
        ) : "Sin clasificar"}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {SEGMENTOS_INTERES.map((s) => (
        <SelectItem key={s} value={s} className="text-xs">
          <span className={`font-semibold ${SEGMENTO_INTERES_COLORS[s] ?? ""}`}>Grupo {s}</span>
          {" — "}
          {s === "A" ? "Listo para comprar" : s === "B" ? "Interesado con dudas" : "Curioso"}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/leads/lead-detail.tsx
git commit -m "feat: show segmentoInteres badge and manual override in lead detail"
```

---

## Task 8: Smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Submit a test lead via the public form**

Go to `http://localhost:3000`, fill the form with:
- Objective: "Saber cuánto podría recibir"
- Semanas cotizadas: Sí
- Situacion: at least 40 characters

Expected: lead created with `segmentoInteres = "A"`.

- [ ] **Step 3: Check leads table**

Go to `http://localhost:3000/leads`. The new lead should show a green **A** badge.

- [ ] **Step 4: Check lead detail**

Open the lead. In the classification section, there should be a "Grupo de interés" select showing "Grupo A". Change it to B — the page should refresh and persist.

- [ ] **Step 5: Check filter**

In the leads table, use the "Grupo" dropdown to filter by A. Only Grupo A leads should appear.
