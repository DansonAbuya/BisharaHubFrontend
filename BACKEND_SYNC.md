# Backend sync: 2FA, user addition, password

This frontend is aligned with the BiasharaHub backend API for 2FA, user roles, and password handling.

## Backend behaviour (summary)

- **2FA (email code)**  
  - Customers and staff always have 2FA on (cannot disable).  
  - Owner and super_admin can enable/disable 2FA in Settings.  
  - After login or customer signup, if 2FA is required the API returns `requiresTwoFactor: true` and no token; the user must call `POST /auth/verify-code` with email + 6-digit code to get tokens.

- **User addition**  
  - **Owner:** Only super_admin, via `POST /admin/owners` with `{ name, email }`. Backend generates a temporary password and sends it by email.  
  - **Staff:** Only owner, via `POST /users/staff` with `{ name, email }`. Same: temp password by email; 2FA always on.  
  - **Assistant admin:** Only super_admin, via `POST /admin/assistant-admins` with `{ name, email }`. Temp password by email; 2FA always on.  
  - **Customer:** Self-signup only via `POST /auth/register`. 2FA always on; a code is sent after signup and they must verify before getting tokens.

- **Password**  
  - `POST /auth/change-password` (authenticated): body `{ currentPassword, newPassword }`. Used by owner/staff/assistant admin to change their temporary password after first login.  
  - No “forgot password” / reset flow in the backend yet.

## Frontend implementation

- **Login** (`/login`): If the API returns `requiresTwoFactor`, the UI shows a 6-digit code step and calls `POST /auth/verify-code`; then stores token and refresh token and redirects to dashboard.  
- **Signup** (`/signup`): Same: after register, if 2FA required, show code step and complete with verify-code.  
- **Auth context**: Exposes `pendingTwoFactor`, `verifyCode`, `cancelTwoFactor`; persists `biashara_token` and `biashara_refresh_token`.  
- **Admin – Owners** (`/dashboard/admin/owners`): Form has name + email only; no password field. Copy explains temp password is emailed.  
- **Admin – Assistant admins** (`/dashboard/admin/assistant-admins`): New page for super_admin; form name + email only.  
- **Staff** (`/dashboard/staff`): Add-staff form has name + email only; no password field.  
- **Settings** (`/dashboard/settings`):  
  - Change password form calls `POST /auth/change-password`.  
  - 2FA: For customer, staff, assistant_admin a message says “2FA is always on”. For owner and super_admin, a toggle calls `POST /auth/2fa/enable` and `POST /auth/2fa/disable`.  
- **Sidebar**: super_admin sees “Add Owners” and “Assistant Admins”; assistant_admin has Overview and Settings.  
- **Roles**: `UserRole` includes `assistant_admin`; dashboard and sidebar handle it.

## API base URL

Set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:5050/api`) and optionally `NEXT_PUBLIC_TENANT_ID` for the default tenant.
