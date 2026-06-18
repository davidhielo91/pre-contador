# Gestor de Leads — Pre-Diagnóstico IMSS

Sistema integral para el **Despacho Fiscal 2087 (Contador Gerardo Huerta)**: landing pública de captación de leads + CRM interno para gestión y seguimiento de prospectos de pensión IMSS.

## Qué hace

- **Landing pública** (`/`) — formulario de 2 pasos que capta el caso del prospecto y lo envía al CRM
- **Página de gracias** (`/gracias`) — confirmación post-envío (no indexada por robots)
- **CRM interno** (`/dashboard`, `/leads`, `/pipeline`, `/settings`) — asesores gestionan, clasifican y dan seguimiento
- **Detección de duplicados** — si el mismo teléfono o correo vuelve a enviar, actualiza el lead existente e incrementa `vecesRecibido`
- **Clasificación automática** — al llegar un lead se asigna categoría, prioridad y viabilidad por reglas en `src/lib/classification.ts`

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.9 (App Router) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Base de datos | SQLite (desarrollo) / PostgreSQL (producción) vía Prisma 5 |
| Auth | Auth.js v5 (NextAuth beta) — Credentials + JWT 8h |
| Middleware | `src/middleware.ts` — protege rutas del CRM, permite landing sin auth |
| Fuentes (landing) | Google Fonts vía `next/font` — Roboto + Open Sans |

## Estructura de rutas

```
/                      → Landing pública (formulario de pre-diagnóstico)
/gracias               → Confirmación post-envío (no indexada)
/login                 → Login de asesores
/dashboard             → KPIs y últimos leads
/leads                 → Tabla filtrable, paginación 30/página
/leads/[id]            → Detalle: historial, notas, acciones rápidas
/pipeline              → Tablero kanban por etapa
/settings              → Gestión de usuarios
/admin                 → Redirige a /dashboard
/api/public/leads      → POST — recibe formularios (rate limit 5/min por IP)
/api/leads/[id]/update → PATCH — actualiza campos de un lead
/api/leads/[id]/action → POST — registra acción (whatsapp, correo, etc.)
/api/leads/[id]/notes  → POST — agrega nota interna
/robots.txt            → Generado por src/app/robots.ts
/sitemap.xml           → Generado por src/app/sitemap.ts
```

---

## Instalación local (desarrollo)

### Requisitos

- Node.js 20+
- npm

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/davidhielo91/pre-contador
cd gestor-leads-prediagnostico

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno para desarrollo local
cp .env.example .env.local
# Editar .env.local — para dev local usa SQLite:
# DATABASE_URL="file:./prisma/dev.db"

# 4. Activar schema SQLite para desarrollo
npm run db:use:sqlite

# 5. Crear base de datos y aplicar esquema
npm run db:push

# 6. Crear usuario admin y datos de ejemplo
npm run db:seed

# 7. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Variables de entorno

| Variable | Descripción | Desarrollo | Producción |
|---|---|---|---|
| `DATABASE_URL` | Conexión a la BD | `file:./prisma/dev.db` | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | Secreto JWT (`openssl rand -base64 32`) | cualquier string | requerido |
| `AUTH_URL` | URL pública de la app | `http://localhost:3000` | `https://tu-dominio.com` |
| `AUTH_TRUST_HOST` | Confianza en reverse proxy | no necesario | `true` |
| `ADMIN_EMAIL` | Email del admin inicial (seed) | `admin@despacho.com` | requerido |
| `ADMIN_PASSWORD` | Contraseña del admin inicial (seed) | `admin123` | requerido |

> **Nota Auth.js v5:** usa `AUTH_SECRET` y `AUTH_URL`, no `NEXTAUTH_SECRET` / `NEXTAUTH_URL`.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:push` | Aplica el schema a la BD sin historial |
| `npm run db:migrate` | Crea y aplica migración con historial |
| `npm run db:seed` | Crea admin y datos de ejemplo |
| `npm run db:studio` | Abre Prisma Studio (GUI de la BD) |
| `npm run db:use:sqlite` | Activa schema SQLite para desarrollo local |
| `npm run db:use:postgres` | Restaura schema PostgreSQL para producción |

---

## Despliegue en producción — EasyPanel

### Via ZIP (recomendado)

1. Generar el ZIP desde el repositorio:
   ```bash
   git archive HEAD --format=zip -o deploy-easypanel.zip
   ```
2. En EasyPanel → **New Service → App → Upload ZIP**
3. Configurar las variables de entorno (ver tabla abajo)
4. Deploy

### Via GitHub

1. Conectar el repositorio en EasyPanel → **New Service → App → GitHub**
2. EasyPanel detecta el `Dockerfile` automáticamente
3. Configurar variables de entorno
4. Deploy

### Variables de entorno en EasyPanel

```env
DATABASE_URL=postgresql://usuario:contraseña@servicio-db:5432/nombre-db
AUTH_SECRET=<string aleatorio — genera con: openssl rand -base64 32>
AUTH_URL=https://tu-dominio.easypanel.host
AUTH_TRUST_HOST=true
ADMIN_EMAIL=tu-email@dominio.com
ADMIN_PASSWORD=tu-contraseña-segura
```

> **Contraseñas con caracteres especiales en `DATABASE_URL`:** URL-encodea los caracteres
> especiales del password (`$` → `%24`, `@` → `%40`, `&` → `%26`).

### Qué hace el contenedor al arrancar

```
1. prisma migrate deploy   → aplica migraciones a PostgreSQL
2. node prisma/seed.js     → crea/sincroniza el usuario admin (actualiza password siempre)
3. node server.js          → inicia Next.js standalone
```

El seed **siempre sincroniza** la contraseña del admin con el valor actual de `ADMIN_PASSWORD`, por lo que cambiar esa variable y redesplegar actualiza las credenciales.

### Dockerfile (multi-stage)

| Stage | Qué hace |
|---|---|
| `builder` | `npm ci` + `prisma generate` + `next build` + compila `seed.ts → seed.js` |
| `runner` | Next.js standalone + Prisma engine + `prisma` CLI vía `node_modules/prisma` |

---

## Estructura de archivos relevante

```
src/
  middleware.ts           → Protege rutas del CRM, permite / y /gracias sin auth
  app/
    (public)/             → Rutas sin auth (landing, gracias)
      landing.css         → CSS scoped bajo .landing-root
      page.tsx            → Landing principal
      gracias/page.tsx    → Confirmación post-envío
    (app)/                → Rutas con auth (CRM)
      layout.tsx          → Verifica sesión, renderiza Sidebar + Header
      dashboard/page.tsx
      leads/page.tsx
      leads/[id]/page.tsx
      pipeline/page.tsx
      settings/page.tsx
    (auth)/login/page.tsx → Página de login
    api/
      public/leads/       → POST público de captación (rate limit 5/min)
      leads/[id]/         → update, action, notes
      users/              → Gestión de usuarios (solo admin)
    robots.ts             → Genera /robots.txt
    sitemap.ts            → Genera /sitemap.xml
  components/
    leads/
      lead-detail.tsx     → Detalle completo del lead (client)
      leads-table.tsx     → Tabla filtrable con paginación (client)
      pipeline-board.tsx  → Tablero kanban (client)
    public/
      landing-form.tsx    → Formulario 2 pasos (client)
      landing-faq.tsx     → FAQ (client)
    ui/                   → Componentes shadcn/ui
  lib/
    classification.ts     → Clasificación automática + detección de duplicados
    constants.ts          → ESTADOS_LEAD, ESTADO_COLORS, PRIORIDADES, etc.
    auth.ts               → Configuración Auth.js v5
    prisma.ts             → Cliente Prisma singleton
  types/
    next-auth.d.ts        → Augmentación: session.user.id / .role tipados
prisma/
  schema.prisma           → Modelos PostgreSQL + índices en campos frecuentes
  schema.sqlite.prisma    → Schema SQLite para desarrollo local
  seed.ts                 → Seed del admin + leads de ejemplo
  migrations/             → Historial de migraciones PostgreSQL
public/
  images/                 → Imágenes de la landing (webp, jpg)
```

---

## Modelos de datos

```
User ──< Lead ──< LeadActivity
               ──< LeadStatusHistory
               ──< LeadNote
```

**Lead** — campos principales:

| Campo | Descripción |
|---|---|
| `estadoLead` | Estado en el pipeline (Nuevo → Agendó diagnóstico → Cerrado) |
| `categoria` | Clasificación automática (Ley 73, Modalidad 40, Invalidez, etc.) |
| `prioridad` | Alta / Media / Baja |
| `viabilidad` | Recomendar diagnóstico / Necesita más info / No viable |
| `telefonoNormalizado` | 10 dígitos sin prefijo 52 — usado para deduplicar |
| `vecesRecibido` | Cuántas veces envió el formulario |

---

## Lógica de duplicados

Al llegar un formulario, se busca lead existente por OR:
- `telefonoNormalizado` igual (dígitos, sin prefijo `52`)
- `telefono` literal igual
- `correo` igual (normalizado a minúsculas)

Si existe: `vecesRecibido += 1`, actualiza `situacion` y `fuente`, registra actividad `formulario_reenviado`. No crea registro nuevo.

## Clasificación automática

En `src/lib/classification.ts`, al crear un lead nuevo:

| Campo | Lógica |
|---|---|
| **Categoría** | Palabras clave en `situacion` + `temaInteres` (Ley 73, Modalidad 40, Viudez, etc.) |
| **Prioridad** | Alta si edad > 60, invalidez o urgencia en texto; Baja si edad < 35 |
| **Viabilidad** | "Recomendar diagnóstico" si hay info suficiente; "No viable" si edad < 25 |

---

## API pública — POST /api/public/leads

Rate limit: **5 solicitudes/minuto por IP** (en memoria).

**Campos requeridos:** `nombre`, `telefono`, `edad`, `ciudad`, `yaEstaPensionado`, `temaInteres`, `situacion`

**Campos opcionales:** `correo`, `estado`, `tieneSemanasCotizadas`, `fuente`, `objetivoPrincipal`

**Respuestas:**

| Código | Significado |
|---|---|
| `201` | Lead nuevo creado |
| `200` | Lead duplicado actualizado |
| `429` | Rate limit superado |
| `400` | Campos faltantes o inválidos |

---

## Roles

| Rol | Acceso |
|---|---|
| `administrador` | Completo — incluye gestión de usuarios en /settings |
| `asesor` | Leads, dashboard, pipeline — sin gestión de usuarios |

## Seguridad

- `src/middleware.ts` — protege todas las rutas del CRM; `/`, `/gracias`, `/login` y `/api/public/*` son públicas
- `AUTH_TRUST_HOST=true` requerido en producción detrás de reverse proxy (EasyPanel/Nginx)
- `ALLOWED_FIELDS` whitelist en PATCH de update — solo campos autorizados modificables
- `session.user.id` y `.role` tipados correctamente vía `src/types/next-auth.d.ts`
- Landing CSS aislada con `.landing-root` para no interferir con Tailwind del CRM

---

## Créditos

Despacho Fiscal 2087 — Contador Gerardo Huerta  
Pensiones IMSS y Jubilación — Ciudad Juárez, Chihuahua
