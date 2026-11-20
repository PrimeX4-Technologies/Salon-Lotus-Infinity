# Salon Lotus Infinity — Customer Web App

Production customer-facing React application for the Salon booking backend. Visitors can browse the salon, branches, services, retail products, and packages without an account. Authentication is required only to create a booking, send a consultation request, or manage customer information.

There are no admin routes, admin API calls, local service fixtures, fake stylists, or generated appointment slots in this application. Visible business/catalog data and availability come from the backend.

## Implemented customer journeys

- Public business and branch information.
- Public services, products, packages, categories, search, branch filtering, and pagination.
- Live service availability grouped by employee and date.
- Customer registration using email or a Sri Lankan local/E.164 mobile number and password.
- Customer login, rotating refresh-cookie sessions, CSRF handling, logout, and Google ID-token login.
- Customer-only role enforcement if a staff account is entered in this portal.
- Replay-safe booking creation with an `Idempotency-Key`.
- Variable/starting-price acknowledgement before booking.
- Consultation requests for quote-required services, products, bundles, weddings, and events.
- Customer appointment history and cancellation.
- Customer consultation history.
- Customer profile and preferred-branch updates.
- Responsive Tailwind UI preserving the generated black/gold visual style.

Products are displayed from the catalog. In-store products are informational, external-link products open the configured merchant URL, and inquiry products create a consultation request. This app does not implement POS, inventory, or final settlement.

## Structure

```text
src/
├── api/             # Axios client, customer/public API modules, domain types
├── auth/            # Session provider, login/register dialog, Google Identity
├── components/      # Shared customer layout and async states
├── features/
│   ├── account/     # Bookings, inquiries, profile, cancellation
│   ├── booking/     # Live availability and booking workflow
│   ├── catalog/     # Public browsing and catalog cards
│   ├── home/        # Backend-powered landing page
│   └── inquiries/   # Consultation/quote request workflow
├── lib/             # Currency, duration, date, and address formatting
├── styles/          # Tailwind and the existing theme
└── main.tsx         # React Query, auth, and router providers
```

## Local setup

Requirements: Node.js 22+, npm, and the running backend with MongoDB and Redis.

```bash
cp .env.example .env
npm ci
npm run dev
```

The frontend runs on `http://localhost:5173`. The backend defaults to `http://localhost:5000`.

Backend development CORS must include the exact frontend origin:

```env
CORS_ORIGIN=http://localhost:5173
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
```

Restart the backend after changing its environment.

## Frontend environment

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=
VITE_AUTH_CSRF_COOKIE_NAME=salon_csrf
VITE_BASE_PATH=/
```

- `VITE_API_BASE_URL` must include `/api/v1` and must not point at an admin-specific service.
- `VITE_GOOGLE_CLIENT_ID` must equal the backend `GOOGLE_CLIENT_ID`. Google Sign-In is hidden when it is blank.
- `VITE_AUTH_CSRF_COOKIE_NAME` must equal backend `AUTH_CSRF_COOKIE_NAME`.
- `VITE_BASE_PATH` is `/` for a normal domain. GitHub Pages builds use `/Salon-Lotus-Infinity/`.
- All `VITE_*` values are public build-time configuration. Never put a secret in them.

## Backend data required before customer testing

Follow the backend `INSTRUCTION.md`. In summary:

1. Start MongoDB and Redis.
2. Run database indexes.
3. Bootstrap the first admin once.
4. Start the API and operations worker.
5. Login through backend Swagger/Postman as that admin.
6. Bootstrap the business and primary branch once.
7. Add active branch hours.
8. Add categories and services/products/packages.
9. Add a branch-service assignment for every service offered at a branch.
10. Add employees, skills, employee-service assignments, and active schedules.
11. Confirm `GET /api/v1/public/availability` returns slots.

An empty backend correctly renders empty states; the frontend never invents fallback catalog or calendar data.

## Authentication design

- The access token stays in memory and is attached by Axios.
- The refresh token remains in the backend HttpOnly cookie.
- The non-secret CSRF value is kept in session storage and sent during refresh.
- Page reload attempts one cookie-based refresh to restore the session.
- One failed protected request can trigger one refresh and one safe replay.
- A failed refresh clears local session state.
- Booking mutation retries are disabled; the booking uses a stable idempotency key for safe user retries.

For production, serve the frontend and API on same-site HTTPS domains where possible, for example `booking.example.com` and `api.example.com`. If they are truly cross-site, configure the backend cookie as `SameSite=None; Secure`, explicitly allow the frontend CORS origin, and verify browser third-party-cookie policy.

## Commands

```bash
npm run dev        # Vite development server
npm run typecheck  # Strict TypeScript check
npm run build      # Production bundle
npm run check      # Typecheck then build
npm run preview    # Preview the production bundle
```

For BrowserRouter deployments, the web server/CDN must rewrite unknown paths such as `/account` and `/catalog` to `index.html`. The included GitHub Pages workflow creates a matching `404.html` fallback so direct customer links work there too.

## Deployment checklist

- Set the production `VITE_API_BASE_URL` and optional Google client ID before building.
- Set backend `CORS_ORIGIN` to the exact deployed frontend origin.
- Use HTTPS and secure cookies.
- Enable SPA fallback to `index.html`.
- Run `npm ci && npm run check`.
- Confirm public catalog calls work while signed out.
- Confirm login survives reload through refresh cookies.
- Confirm live availability and booking creation.
- Confirm the same booking request cannot duplicate when replayed.
- Confirm customer A cannot view customer B's records.
