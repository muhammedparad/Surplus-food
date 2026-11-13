# Frontend Architecture Blueprint — Surplus Food Rescue

**Project:** Surplus Food Rescue  
**Status:** Approved Architectural Blueprint  
**Target Environment:** React 19 + Vite (Single Page Application)  
**Primary Owner:** Member 1 (Frontend Lead)  

---

## 1. Executive Summary & Stack Confirmation

The Surplus Food Rescue frontend is engineered as a high-performance, modular, accessible Single Page Application (SPA). It connects food donors (restaurants), beneficiary organizations (NGOs), transport volunteers, and platform administrators through dedicated, role-guarded workflows.

### Confirmed Frontend Technology Stack
- **Framework & Tooling:** React 19 + Vite + TypeScript (Strict mode)
- **Styling & Design System:** Tailwind CSS v4 (Modern theme-driven configuration via `@tailwindcss/vite` plugin, CSS-first `@import "tailwindcss";` and `@theme` directives without legacy `tailwind.config.js`)
- **Routing:** React Router v7 (Declarative, nested role-based layouts)
- **Server State & Caching:** TanStack Query v5 (Data synchronization, optimistic updates, query caching)
- **Form Management & Validation:** React Hook Form + Zod (Strict schema validation and type inference)
- **Icons & Visual Indicators:** Lucide React
- **Data Visualization & Metrics:** Recharts (Impact dashboards and delivery statistics)

> [!IMPORTANT]
> **No Next.js or Server-Side Framework:** The frontend is strictly an independent client SPA built with Vite. It communicates asynchronously with the NestJS backend via REST API endpoints.

---

## 2. Directory Architecture & File Structure

The project adopts a scalable **feature-driven architecture**. High-level code is grouped by domain feature rather than technical file type, keeping related components, hooks, and types co-located.

```text
src/
├── app/                      # Application core shell, providers & top-level routing
│   ├── layouts/              # Shared structural shells (RootLayout, AuthLayout, DashboardLayout)
│   ├── providers/            # React context providers (AuthProvider, QueryProvider, ThemeProvider)
│   └── router/               # Route definitions, guards, and navigation config
├── assets/                   # Static media, logos, brand vectors, and illustrations
├── components/               # Global shared reusable components (non-domain specific)
│   ├── common/               # Feedback and state displays (EmptyState, ErrorBoundary, StatCard)
│   ├── forms/                # Reusable form primitives (FormField, ControlledInput, SelectField)
│   └── ui/                   # Atomic UI elements (Button, Card, Badge, Modal, Dropdown, Table)
├── features/                 # Domain-driven feature modules (Co-located logic)
│   ├── admin/                # Verification queues, organization audits, platform monitoring
│   ├── auth/                 # Sign in, registration, role selection, password reset
│   ├── claims/               # NGO claiming flow, restaurant claim approval & rejection
│   ├── deliveries/           # Volunteer delivery tracking, pickup verification, proof of drop-off
│   ├── donations/            # Donation listing, creation wizard, allergen & safety checklists
│   ├── matching/             # [Member 3] Algorithmic matching between donors & nearest NGOs
│   ├── ngo/                  # NGO profile, food discovery feed, claimed inventory
│   ├── notifications/        # Real-time event notifications and activity drawer
│   ├── qr-verification/      # [Member 3] QR token generation and scanning handoff verification
│   ├── restaurant/           # Restaurant profile, active donations manager, historical logs
│   ├── route-optimization/   # [Member 3] Distance matrix and volunteer transit routing
│   ├── urgency/              # [Member 3] Perishability countdowns and urgency decay calculation
│   └── volunteer/            # Volunteer profile, available task board, assigned missions
├── hooks/                    # Global utility hooks (useDebounce, useMediaQuery, useGeolocation)
├── lib/                      # Third-party library initializations (queryClient, apiClient)
├── services/                 # Centralized API network client and token storage
├── types/                    # Shared global domain and API contract types
└── utils/                    # Pure utility functions (formatting, dates, unit conversions)
```

---

## 3. Directory Responsibilities & Ownership Rules

| Directory | Responsibility & Permitted Contents | Forbidden Contents | Primary Owner |
| :--- | :--- | :--- | :--- |
| `src/app/` | Global app initialization, provider composition, top-level layout trees, routing configuration. | Feature-specific business logic or domain components. | Member 1 |
| `src/components/ui/` | Headless, atomic UI building blocks (Button, Input, Badge, Dialog, Tooltip). | Domain logic, API calls, store queries, or specific business terminology. | Member 1 |
| `src/components/forms/` | Reusable Form controls integrated with React Hook Form. | Direct submission endpoints or domain mutation calls. | Member 1 |
| `src/features/<domain>/` | Complete domain modules: pages, subcomponents, hooks (`useDonations`), and feature schemas. | Unrelated domain code or hardcoded cross-feature imports. | Member 1 (MVP: `auth`, `restaurant`, `ngo`, `volunteer`, `admin`, `donations`, `claims`, `deliveries`) |
| `src/features/<advanced>/` | Specialized advanced algorithms: `matching`, `urgency`, `route-optimization`, `qr-verification`. | Modifying core DB schemas or altering core donation lifecycles independently. | Member 3 (Advanced Modules Lead) |
| `src/services/` | Base HTTP client configuration, interceptors, error normalization, auth token injection. | React UI code, JSX, or page rendering logic. | Member 1 & Member 2 |
| `src/types/` | Shared domain TypeScript interfaces, API contract contracts, and enums. | Component implementations or runtime functions. | Shared (All Members) |
| `src/utils/` | Deterministic, pure functions (e.g. date formatters, distance calculators, weight units). | State management, React hooks, or side effects. | Member 1 |

---

## 4. Feature Boundaries & Routing Independence

1. **Independence of URL Routing vs. Source Feature Hierarchy:**  
   URL routes (e.g. `/restaurant/claims/review`, `/ngo/discover`, `/volunteer/delivery/:id`) represent user navigation paths, while `src/features/` organizes business capability modules. Role-specific page views compose reusable domain features rather than duplicating them:
   - **NGO pages** (in `src/features/ngo/` or mounted in `src/app/router/`) consume `src/features/donations/` (discovery feed, cards) and `src/features/claims/` (claim submission modal).
   - **Restaurant pages** consume `src/features/donations/` (donor wizard) and `src/features/claims/` (review and approve/reject claims).
   - **Volunteer pages** consume `src/features/deliveries/` (task board, delivery cockpit).
   - **Advanced widgets** (`matching`, `urgency`, `route-optimization`, `qr-verification`) are plugged into domain feature slots.
2. **Co-location Rule:** Everything needed for a domain feature to function (domain subcomponents, validation schemas, feature hooks, mock data) lives inside its respective `src/features/<feature-name>/`.
3. **Encapsulated Exports:** Each feature folder exports its public pages and reusable components via an `index.ts`. Internal subcomponents must never be deep-imported by external features.
4. **Cross-Feature Imports:** If Feature A needs functionality from Feature B (e.g. `deliveries` referencing `donations`), it consumes shared domain types from `src/types/` or passes high-level callbacks/slot props rather than tightly coupling component implementations.

---

## 5. Engineering & Component Conventions

### Component Structure Standard
```tsx
// Example: src/components/ui/Button.tsx
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // variant styles
        variant === 'primary' && 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
        // size styles
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        isLoading && 'opacity-70 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
```

### TypeScript Standards
- **Strict Mode Enforced:** `noImplicitAny: true`, `strictNullChecks: true`.
- **Zero `any` Policy:** Use `unknown` for unparsed data, and parse with Zod before state assignment.
- **Explicit Interfaces:** Prefer `interface` for object contracts and `type` for unions/primitives.
- **Path Aliasing:** Use `@/*` pointing to `src/*` across all imports (no relative imports deeper than `../`).

---

## 6. UX Patterns: States, Accessibility, Error Boundaries & Offline Handling

### 1. Three-Tier State Handling & Error Boundaries
Every screen and data container systematically implements:
- **Loading State:** Content-matched Skeleton components (never generic full-screen spinners).
- **Empty State:** Visual illustration, descriptive headline, explanation, and a clear call-to-action button (e.g. "No active donations available. Check back soon or refine your search radius.").
- **Error State:** Human-readable error message with a "Retry" trigger and an option to report issues.
- **Root-Level Error Boundary:** A top-level React Error Boundary wraps the entire app layout (`RootLayout.tsx`). If an uncaught rendering error occurs, it catches the exception, prevents white-screen crashes, displays a friendly recovery screen ("Something went wrong"), and provides a "Reload Application" button while preserving route parameters.

### 2. Network Connectivity & Offline Handling (Lightweight MVP)
Volunteers and field representatives often face intermittent cellular connectivity:
- **Connectivity Detection:** The app listens to `window.addEventListener('online')` and `window.addEventListener('offline')` via a custom `useNetworkStatus()` hook.
- **Offline / Online Banner:** A non-intrusive status toast informs the user when offline ("You are currently offline. Changes cannot be submitted.") and confirms reconnection ("Connection restored.").
- **Mutation Safeguards & Duplicate Submission Prevention:**
  - Submit buttons are immediately disabled upon click and display an in-flight loading spinner (`isLoading`).
  - Mutations block submission if `navigator.onLine === false`, displaying an immediate alert: "Cannot submit while offline. Please reconnect."
  - Avoid false success states: State is never updated optimistically for irreversible financial or food safety handoffs unless backed by API confirmation or mock store confirmation.
  - Form Preservation: If a mutation fails or connection drops, React Hook Form state is preserved in memory so user-entered data is NOT lost or wiped out.
- **MVP Boundary:** To prevent unnecessary complexity during a hackathon, no heavy background sync queues (like IndexedDB / ServiceWorker background sync) are introduced. Clear feedback, form preservation, and retry triggers provide resilient field usability.

### 3. Tailwind CSS v4 Styling Configuration
- **Engine:** Tailwind CSS v4 using the official `@tailwindcss/vite` plugin.
- **CSS-First Configuration:** Root styles in `src/index.css` utilize `@import "tailwindcss";` and native `@theme` directives:
  ```css
  @import "tailwindcss";

  @theme {
    --color-brand-primary: #059669; /* Emerald 600 */
    --color-brand-accent: #e07a5f;  /* Terracotta */
    --color-brand-surface: #f8fafc; /* Slate 50 */
  }
  ```
- **No Legacy Config:** Do not generate or maintain legacy `tailwind.config.js` or `postcss.config.js` files unless a specific third-party integration strictly demands it.

### 4. Form Architecture with React Hook Form & Zod
- Every form defines a Zod schema in `src/features/<feature>/schemas.ts`.
- Types are inferred directly: `type CreateDonationInput = z.infer<typeof createDonationSchema>`.
- Real-time client-side validation triggers on blur; submission blocks invalid inputs and surfaces field-level inline error text with `role="alert"`.

### 5. Responsive Breakpoints & Mobile-First Layout
- **Mobile First:** Volunteers operate predominantly on mobile phones during deliveries. All volunteer actions (accepting tasks, viewing pickup notes, verifying handoffs) must be optimized for 375px+ portrait viewports.
- **Touch Targets:** Minimum 44x44px clickable areas for buttons and inputs on touch devices.
- **Breakpoints:** Follow Tailwind standards: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.

### 6. Accessibility (a11y)
- Semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`).
- All interactive controls must support full keyboard navigation (`Tab`, `Enter`, `Space`, `Escape` for modals).
- Text contrast must exceed WCAG AA 4.5:1 ratio against background colors.
