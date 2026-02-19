---
trigger: always_on
---
# 🏄‍♂️ Guía de Buenas Prácticas – Proyecto Fullstack (React + TypeScript + Tailwind + Express)

Diseño orientado a **minimalismo, rendimiento y fluidez (smooth UX)**, con una arquitectura limpia y fácil de escalar.

---

# 🧭 Principios base

- **Simplicidad primero**: evita sobreingeniería.
- **Componentes pequeños y reutilizables**.
- **Separación clara de responsabilidades**.
- **Código predecible y consistente**.
- **Optimización desde el inicio** (no como parche).
- **Experiencia fluida**: animaciones sutiles, carga rápida.

---

# 📁 Estructura del proyecto

## Frontend (React + TS + Tailwind)

```
src/
│
├── app/                # Configuración global (router, providers)
├── components/         # Componentes reutilizables (UI)
│   ├── ui/             # Botones, inputs, cards (puros)
│   └── layout/         # Navbar, Sidebar, Layout
│
├── features/           # Lógica por dominio
│   └── user/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types.ts
│
├── hooks/              # Hooks globales
├── lib/                # Utils, helpers, config
├── pages/              # Páginas (si no usas App Router)
├── services/           # API calls globales
├── styles/             # Tailwind + estilos globales
└── types/              # Tipos compartidos
```

---

## Backend (Express + TS)

```
src/
│
├── config/             # Configuración (env, db)
├── controllers/        # Lógica de endpoints
├── routes/             # Definición de rutas
├── services/           # Lógica de negocio
├── models/             # Esquemas / ORM
├── middlewares/        # Auth, errores, logs
├── utils/              # Helpers
└── types/              # Tipos TS
```

---

# 🧱 Componentización (React)

## Reglas clave

- Un componente = una responsabilidad
- Máximo ~150 líneas por componente
- Separar lógica en hooks
- Evitar props innecesarias

---

## Ejemplo

### ❌ Mal
```tsx
// Todo en un solo archivo
```

### ✅ Bien
```
UserCard/
├── UserCard.tsx
├── UserCard.types.ts
├── UserCard.hooks.ts
└── index.ts
```

---

## Tipos claros

```ts
export interface UserCardProps {
  name: string;
  avatar?: string;
}
```

---

# 🎯 Diseño minimalista (Tailwind)

## Principios

- Espaciado consistente (`p-4`, `gap-4`)
- Pocos colores
- Tipografía limpia
- Bordes suaves (`rounded-xl`)
- Sombras ligeras

---

## Paleta recomendada

```js
colors: {
  primary: '#2563eb',
  secondary: '#64748b',
  background: '#0f172a',
  surface: '#1e293b',
}
```

---

## Ejemplo UI

```tsx
<button className="px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition">
  Guardar
</button>
```

---

# ⚡ Rendimiento

## Frontend

- Lazy loading de rutas
- `React.memo` para componentes pesados
- Evitar renders innecesarios
- Usar `useCallback` / `useMemo` cuando tenga sentido
- Dividir bundles

```tsx
const Page = lazy(() => import('./Page'));
```

---

## Backend

- Middleware ligero
- Validación temprana
- Cache cuando sea posible
- Evitar consultas duplicadas

---

# 🌊 UX fluida (smooth)

## Animaciones

- Cortas (150–300ms)
- Naturales (ease-in-out)

```tsx
<div className="transition-all duration-200 hover:scale-105" />
```

---

## Feedback visual

- Loading states
- Skeletons
- Botones deshabilitados

---

# 🔌 API (Express)

## Estructura limpia

```ts
// route
router.get('/users', getUsers);

// controller
export const getUsers = async (req, res) => {
  const users = await userService.getAll();
  res.json(users);
};
```

---

## Validación

Usar librerías como:
- zod
- joi

```ts
const schema = z.object({
  email: z.string().email(),
});
```

---

# 🔄 Estado (React)

## Opciones

- Simple → `useState`
- Medio → `Context`
- Complejo → `Zustand` o `Redux`

---

## Recomendación

Empieza simple:

```tsx
const [user, setUser] = useState<User | null>(null);
```

Escala solo cuando sea necesario.

---

# 🧹 Código limpio

## Convenciones

- camelCase → variables
- PascalCase → componentes
- Archivos claros: `UserCard.tsx`

---

## Funciones pequeñas

```ts
// ❌
function handleEverything() {}

// ✅
function handleLogin() {}
function validateForm() {}
```

---

# 🔐 Seguridad (Backend)

- Sanitizar inputs
- No exponer errores internos
- Usar variables de entorno
- Rate limiting

---

# 📦 Tipos compartidos

Crea una carpeta común:

```
shared/
└── types/
```

Evita duplicar tipos entre frontend y backend.

---

# 🧪 Testing (opcional pero recomendado)

- Frontend → React Testing Library
- Backend → Jest

---

# 🚀 Deploy

## Frontend

- Vercel / Netlify

## Backend

- Render / Railway / Fly.io

---

# 🧭 Resumen

- Componentes pequeños y reutilizables
- Estructura por features
- Diseño limpio y consistente
- Optimización desde el inicio
- API clara y desacoplada

---

# 🧠 Regla de oro

> Si algo se siente complicado, probablemente se puede simplificar.

---
