# Frontend

Standalone React single-page app: **React, TypeScript, Vite, React Router, Axios, TanStack Query,
React Hook Form, Zod, Zustand and Material UI**. It has no server or database code and talks to
the backend only through its REST API.

## Setup

```bash
npm install
cp .env.example .env     # set VITE_API_URL if your API is not on localhost:5000
npm run dev              # http://localhost:5173
```

```
VITE_API_URL=http://localhost:5000/api
```

The URL is never hardcoded: `src/utils/constants.ts` reads it and `src/services/api.ts` passes it to Axios.
The backend must allow this origin in its `CORS_ORIGIN`.

## Scripts

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Vite dev server                        |
| `npm run build`   | Type-check (`tsc`) and production build |
| `npm run preview` | Serve the production build locally     |

## Structure

```
src/
├── app/          Application routes and config paths
├── assets/       Static assets and graphics
├── lib/          api client (Axios + token refresh interceptor), TanStack queryClient
├── modules/      Feature-driven modules
│   └── core/
│       ├── app-config/
│       ├── cadre-category-duty-mapping/
│       ├── designation/ (api, hooks, ui: DesignationPage & DesignationFormModal, types, index)
│       ├── user/        (api, hooks, ui: UserPage & UserFormModal, types, index)
│       ├── auth/        (api, hooks, ui: LoginPage, RegisterPage, AuthLayout, types, index)
│       └── dashboard/   (ui: DashboardPage, index)
├── providers/    AppProviders (QueryClientProvider, ThemeProvider, CssBaseline, BrowserRouter)
├── shared/       Cross-cutting design-system (Dialogs, FormTextField, Loading, Notifier), layout, hooks, utils
├── stores/       Zustand stores (authStore, notificationStore)
├── styles/       Theme configuration and styles
├── App.tsx       Root application component
├── main.tsx      Vite React DOM entry point
├── RootLayout.tsx Primary application layout (Sidebar + Topbar + Notifier)
├── router.tsx    Application router configuration
└── vite-env.d.ts
```

## How it works

- **Auth**: login/register store the user and tokens in a Zustand store (mirrored to `localStorage`).
  Axios adds `Authorization: Bearer <token>`. On a `401` it calls `/auth/refresh` once (shared across
  concurrent requests), retries the request, and signs the user out if refresh fails.
- **Routes**: `/login` and `/register` are guest-only; everything else sits behind `ProtectedRoute`.
  `/users/new` additionally requires the `admin` role.
- **Users**: searchable, paginated table with create, edit and delete. The first account that
  registers is the admin; regular users can only edit themselves.
- **Forms**: React Hook Form with Zod validation (`@hookform/resolvers`).

## Note on token storage

Tokens are kept in `localStorage` to keep the example simple. For higher-security deployments,
move the refresh token to an `HttpOnly` cookie set by the backend.
