# Backend sync: API-only communication

This frontend (**BisharaHubFrontend**) is the only UI for BiasharaHub. It communicates with the backend (**BiasharaHubBackend**) **only via HTTP APIs**. No frontend code lives in the backend repo.

## API base URL

- Set **`NEXT_PUBLIC_API_URL`** (e.g. `http://localhost:5050/api`) in `.env.dev` / `.env.local`.
- Optional: **`NEXT_PUBLIC_TENANT_ID`** for the default tenant.
- Backend runs on port **5050** by default (`server.port` in `application.yml`). Backend CORS allows `http://localhost:3000` and `http://127.0.0.1:3000`.

## 2FA, user addition, password

This frontend is aligned with the BiasharaHub backend API for 2FA, user roles, and password handling.

## Backend behaviour (summary)

- **2FA (email code)**  
  - Customers and staff always have 2FA on (cannot disable).  
  - Owner and super_admin can enable/disable 2FA in Settings.  
  - After login or customer signup, if 2FA is required the API returns `requiresTwoFactor: true` and no token; the user must call `POST /auth/verify-code` with email + 6-digit code to get tokens.

- **User addition**  
  - **Owner:** Only super_admin, via `POST /admin/owners` with `{ name, email, businessName }`. Backend generates a temporary password and sends it by email. Owner is created with `verificationStatus: pending` and default `sellerTier: tier1`; their shop is not visible until an admin verifies them.  
  - **Staff:** Only owner, via `POST /users/staff` with `{ name, email }`. Same: temp password by email; 2FA always on.  
  - **Assistant admin:** Only super_admin, via `POST /admin/assistant-admins` with `{ name, email }`. Temp password by email; 2FA always on.  
  - **Customer:** Self-signup only via `POST /auth/register`. 2FA always on; a code is sent after signup and they must verify before getting tokens.

- **Password**  
  - `POST /auth/change-password` (authenticated): body `{ currentPassword, newPassword }`. Used by owner/staff/assistant admin to change their temporary password after first login.  
  - No “forgot password” / reset flow in the backend yet.

## Onboarding and verification of the three seller tiers

Sellers (business owners) are **onboarded by the admin** only; they cannot self-sign up as owners.

1. **Onboarding:** Admin adds an owner via **Add Owners** (`/dashboard/admin/owners`): name, email, business name. Backend creates the owner with `verificationStatus: pending` and sends a temporary password by email. The owner’s **shop is not visible** on the platform until they are verified.
2. **Owner documents (optional):** The owner can upload verification documents via the backend (`POST /verification/documents`). Document types align with tiers (e.g. national ID, business registration, KRA PIN, compliance).
3. **Verification and tier:** An admin (super_admin or assistant_admin) uses **Verify Owners** (`/dashboard/admin/pending-verification`). They see a list of owners with `verificationStatus: pending`. For each owner the admin can:
   - **Verify** and choose a **seller tier**: **Tier 1 (Informal)**, **Tier 2 (Registered SME)**, or **Tier 3 (Corporate)**. Once verified, the owner’s shop appears on the home and shop pages, grouped by that tier.
   - **Reject**, optionally with notes.
4. **Three tiers:** Backend defines tier1 = Informal (e.g. ID, phone, email), tier2 = Registered SME (e.g. business reg + location), tier3 = Corporate (e.g. KRA PIN + compliance). The tier is set by the admin at verification time and is used to categorise shops on the marketplace.

## Shops and businesses (intended behaviour)

- **When a business is added and verified, a shop is automatically created for them.** The shop is the verified business (one shop per business). Only verified owners with a business appear in the marketplace shops list (`GET /products/businesses`). So any customer visiting the platform can see all such shops.
- **Shops are visible to any customer:** The marketplace lists all verified businesses (shops). No separate “create shop” step — verification makes the business’s shop visible.
- **Products are visible based on the shop the customer selects:** Customers choose a shop, then see only that shop’s products. The frontend calls `listProducts({ businessId })` so products are scoped to the selected shop.
- **Shops are categorised per tier:** Backend exposes `sellerTier` on each shop (tier1 = Informal, tier2 = Registered SME, tier3 = Corporate). The shop UI groups or filters shops by tier so customers can browse by tier.

## Product & role visibility (intended behaviour)

- **When no user is logged in:** The app shows the **public home page** at `/`. Users can open the **public shop** at `/shop` without signing in. Login and Sign up are in the header.
- **Customers don’t need to sign up or sign in to view products:** At `/shop`, customers see **shops** (by tier) and **select a shop** to see that shop’s products. When a guest tries to **add to cart** or **proceed to checkout**, they are prompted to sign in or sign up (return URL `/shop`). After signing in they can add to cart and place orders.
- **Business owners and staff (sellers):** They use the **Sellers center** (dashboard) and only **view and manage products that belong to their business**. Everything in the app is scoped to their business.
- **Customers:** They see **shops** (verified businesses, grouped by tier) and **products for the shop they select**. Browsing is public; placing orders requires sign-in.

## Admin access (not on the platform)

- **Admin login** is at **`/admin/login`**. It is **not linked** from the main site (no footer, nav, or home link). Only administrators who know the URL (or have it bookmarked) can access it.
- **Allowed roles:** Only **super_admin** and **assistant_admin** can sign in there. If a non-admin (owner, staff, customer) signs in on that page, they see “Access denied. This area is for administrators only.” and their session is cleared for that attempt.
- **Use case:** Admins open `/admin/login`, sign in, then use the dashboard to onboard businesses (Add Owners, Assistant Admins), verify owners, and perform other admin functions.
- **Main login** (`/login`) remains for owners, staff, and customers; it is linked from the platform.

## Frontend implementation

- **Home** (`/`): If not logged in, show the public home page with Shop, Login, and Sign up. If logged in, redirect to `/dashboard`.
- **Shop** (`/shop`): Public. Lists **shops** (verified businesses) **grouped by tier** (Informal, Registered SME, Corporate). Customer **selects a shop** to see only that shop’s products. Products load via `listProducts({ businessId })`. No login required to view; "Add to cart" and "Checkout" prompt sign-in/sign-up (`returnUrl=/shop`). Logged-in users can add to cart and place orders (checkout dialog → `POST /orders`).
- **Login** (`/login`): Supports `?returnUrl=` (default `/dashboard`). If the API returns `requiresTwoFactor`, the UI shows a 6-digit code step and calls `POST /auth/verify-code`; then stores token and refresh token and redirects to returnUrl.  
- **Signup** (`/signup`): Supports `?returnUrl=` (default `/dashboard`). Same: after register, if 2FA required, show code step and complete with verify-code; then redirect to returnUrl.  
- **Auth context**: Exposes `pendingTwoFactor`, `verifyCode`, `cancelTwoFactor`; persists `biashara_token` and `biashara_refresh_token`.  
- **Admin login** (`/admin/login`): Not linked from the platform. Only super_admin and assistant_admin can proceed; others see “Access denied” and session is cleared. After success, redirect to `/dashboard`.
- **Admin – Owners** (`/dashboard/admin/owners`): Form: name, email, business name. Temp password is emailed; owner is created as pending verification.  
- **Admin – Verify Owners** (`/dashboard/admin/pending-verification`): Lists owners pending verification. Admin can Verify (with tier: Informal / Registered SME / Corporate) or Reject. Uses `GET /verification/admin/pending-owners` and `PATCH /verification/admin/owners/:id`. super_admin and assistant_admin can access.  
- **Admin – Assistant admins** (`/dashboard/admin/assistant-admins`): New page for super_admin; form name + email only.  
- **Staff** (`/dashboard/staff`): Add-staff form has name + email only; no password field.  
- **Settings** (`/dashboard/settings`):  
  - Change password form calls `POST /auth/change-password`.  
  - 2FA: For customer, staff, assistant_admin a message says “2FA is always on”. For owner and super_admin, a toggle calls `POST /auth/2fa/enable` and `POST /auth/2fa/disable`.  
- **Sidebar**: super_admin sees Add Owners, Verify Owners, Assistant Admins; assistant_admin sees Verify Owners and Settings.  
- **Roles**: `UserRole` includes `assistant_admin`; dashboard and sidebar handle it.

## API base URL

Set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:5050/api`) and optionally `NEXT_PUBLIC_TENANT_ID` for the default tenant.
