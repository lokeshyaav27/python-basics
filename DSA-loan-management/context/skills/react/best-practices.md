# React + TypeScript Best Practices

## 1. Recommended structure

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── config/
├── pages/
├── containers/
├── components/
│   ├── common/
│   └── shared/
├── features/
├── services/
├── hooks/
├── store/
├── constants/
├── helpers/
├── types/
├── locales/
├── assets/
└── styles/
```

Use feature folders when a feature becomes large.

## 2. TypeScript

Use TypeScript throughout the application.

- Avoid `any`.
- Define API request/response types.
- Type component props.
- Type hooks and service methods.
- Prefer discriminated unions for states with different shapes.
- Keep domain types separate from UI-only types when useful.

## 3. Page / Container / Presentation

Use the pattern when a page has meaningful orchestration.

```text
Page
 ↓
Container
 ↓
Presentation Components
```

### Page
Responsible for routing/page composition.

### Container
Responsible for:
- fetching data
- mutations
- state orchestration
- calling hooks/services

### Presentation
Responsible mainly for:
- rendering
- user interaction callbacks
- visual state

Do not force every tiny component into three layers.

## 4. Services

API calls belong in services.

```text
services/
├── auth.service.ts
├── customer.service.ts
├── loan.service.ts
├── bank.service.ts
└── agent.service.ts
```

Components should not contain raw Axios calls.

```text
Component → Hook → Service → API
```

## 5. Hooks

Use custom hooks for reusable behavior and server-state orchestration.

Examples:

```text
useAuth()
useCustomer()
useLoan()
useBankProducts()
usePagination()
useDebounce()
```

Do not create hooks just to wrap one trivial line unless it improves consistency.

## 6. Store

Use the store for genuine client/application state.

Good candidates:

- authenticated user
- selected role
- global UI state
- permissions
- session-level preferences

Do not duplicate server state in the global store if a server-state library is being used.

## 7. Public and protected routes

Keep route protection explicit.

```text
PublicRoute
  ├── Home
  ├── Login
  └── Apply Loan

ProtectedRoute
  ├── Admin
  ├── Agent
  └── Customer
```

Then add role/permission guards:

```text
ProtectedRoute
   ↓
RoleGuard
   ↓
Admin / Agent / Customer
```

Never rely only on frontend route protection. Backend authorization is mandatory.

## 8. Shareable components

Reusable UI components should live in:

```text
components/
├── common/
└── shared/
```

Examples:

```text
DataTable
PageHeader
FormField
ConfirmDialog
StatusBadge
EmptyState
LoadingState
```

Keep domain-specific components near their feature when they are not truly reusable.

## 9. Constants

Keep repeated fixed values out of components.

```text
constants/
├── routes.ts
├── loan.ts
├── status.ts
└── validation.ts
```

Avoid magic strings such as:

```typescript
if (status === "forwardedToBank")
```

Prefer:

```typescript
if (status === CUSTOMER_STATUS.FORWARDED_TO_BANK)
```

## 10. Helpers / utilities

Use `helpers/` or `utils/` for pure reusable functions.

Examples:

- currency formatting
- date formatting
- validation helpers
- string helpers
- permission helpers

Avoid putting business workflows into generic utilities.

## 11. i18n / locale

Keep translations outside components.

```text
locales/
├── en/
│   ├── common.json
│   ├── customer.json
│   └── loan.json
└── hi/
    ├── common.json
    ├── customer.json
    └── loan.json
```

Use translation keys:

```tsx
t("loan.apply.title")
```

Do not hardcode user-facing text throughout components.

Keep locale configuration centralized.

## 12. Forms

Keep form definitions and validation organized.

```text
features/loan/
├── components/
├── hooks/
├── schemas/
└── types/
```

Multi-step questionnaire forms should have clearly separated steps and a single typed data model.

## 13. Server state

Keep server state separate from UI/client state.

```text
Server state → React Query / TanStack Query
Client state → Store
```

Avoid storing API responses redundantly in Redux/store unless there is a clear reason.

## 14. Error/loading/empty states

Every data-driven page should consider:

- Loading
- Error
- Empty
- Success

Do not let each component invent its own inconsistent behavior.

## 15. React performance

- Avoid unnecessary global state.
- Memoize only when there is a measured reason.
- Use stable keys.
- Lazy-load large routes/features where useful.
- Avoid unnecessary effects.
- Prefer derived values over duplicated state.
- Keep expensive calculations outside render.

## 16. Security

- Never treat frontend authorization as security.
- Never store sensitive secrets in frontend code.
- Validate permissions on the backend.
- Sanitize/validate user-controlled data.
- Handle authentication tokens according to the chosen security model.

## 17. Naming

Use consistent naming:

```text
CustomerListPage.tsx
CustomerDetailPage.tsx
CustomerForm.tsx

useCustomer.ts
customer.service.ts

customer.types.ts
customer.constants.ts
customer.helpers.ts
```

Prefer clear names over abbreviations.
