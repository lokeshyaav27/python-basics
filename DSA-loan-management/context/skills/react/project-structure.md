# React Project Structure

Recommended starting structure for the DSA platform:

```text
frontend/
└── src/
    ├── app/
    │   ├── router/
    │   │   ├── AppRouter.tsx
    │   │   ├── PublicRoute.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   └── RoleGuard.tsx
    │   ├── providers/
    │   └── config/
    │
    ├── pages/
    │   ├── public/
    │   ├── auth/
    │   ├── admin/
    │   ├── agent/
    │   └── customer/
    │
    ├── containers/
    │
    ├── features/
    │   ├── auth/
    │   ├── customer/
    │   ├── loan/
    │   ├── bank/
    │   └── agent/
    │
    ├── components/
    │   ├── common/
    │   └── shared/
    │
    ├── services/
    │
    ├── hooks/
    │
    ├── store/
    │
    ├── constants/
    │
    ├── helpers/
    │
    ├── types/
    │
    ├── locales/
    │
    ├── assets/
    │
    └── styles/
```

## Responsibility summary

| Folder | Responsibility |
|---|---|
| `pages` | Route-level pages |
| `containers` | Page orchestration |
| `features` | Domain/feature-specific code |
| `components/shared` | Reusable application components |
| `components/common` | Generic UI components |
| `services` | API/external service calls |
| `hooks` | Reusable React behavior |
| `store` | Client/global state |
| `constants` | Fixed application values |
| `helpers` | Pure reusable utilities |
| `types` | Shared TypeScript types |
| `locales` | i18n translations |
| `app` | App bootstrap, providers and routing |
