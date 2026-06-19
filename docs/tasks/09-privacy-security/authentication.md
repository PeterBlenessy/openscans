# Task: Implement Authentication (OpenID Connect)

**Feature**: [Authentication](../../features/09-privacy-security/authentication.md)
**Priority**: Tier 3 — Evaluate Later
**Estimated Effort**: High (5-7 days)
**Dependencies**: DICOMweb/PACS Integration (primary use case for auth)

> ⚠️ **Server-requiring — conflicts with the privacy-first principle.** OpenID Connect authentication requires an identity provider and a secured backend, which is at odds with OpenScans' "client-side only / no server / no PHI at rest" posture (see `CLAUDE.md` → "Privacy First"). It only makes sense alongside a server-backed (PACS) deployment and is a deliberate, opt-in decision, not a default. The zero-footprint browser and local-only desktop modes must keep working with no backend and no login.

## Overview

Add user authentication via OpenID Connect for secured access in institutional deployments.

## Implementation Steps

### Step 1: Add OIDC Client Library

**File**: `package.json`

1. Install: `pnpm add oidc-client-ts`

### Step 2: Create Auth Configuration Store

**File**: `src/stores/authStore.ts`

1. Create Zustand store for auth state:
   ```typescript
   interface AuthState {
     isAuthenticated: boolean
     user: UserProfile | null
     accessToken: string | null
     isLoading: boolean
     error: string | null
     login: () => Promise<void>
     logout: () => Promise<void>
     handleCallback: () => Promise<void>
   }

   interface UserProfile {
     name: string
     email: string
     roles: string[]
   }
   ```

### Step 3: Create OIDC Client Configuration

**File**: `src/lib/auth/oidcClient.ts`

1. Configure the OIDC client:
   ```typescript
   import { UserManager } from 'oidc-client-ts'

   const oidcConfig = {
     authority: '',  // from settings
     client_id: '',  // from settings
     redirect_uri: `${window.location.origin}/callback`,
     response_type: 'code',
     scope: 'openid profile email',
   }

   export const userManager = new UserManager(oidcConfig)
   ```
2. Support configurable authority and client_id from settings

### Step 4: Create Login/Logout Flow

**File**: `src/lib/auth/oidcClient.ts`

1. `login()` — redirect to identity provider
2. `handleCallback()` — process the auth callback, extract tokens
3. `logout()` — clear session and redirect to identity provider logout
4. `silentRefresh()` — refresh access token before expiry

### Step 5: Create Auth UI Components

**File**: `src/components/auth/LoginButton.tsx`

1. Login button in the header/drawer (when not authenticated)
2. User profile display when authenticated (name, avatar)
3. Logout button
4. Protected route wrapper for pages requiring auth

### Step 6: Create Auth Configuration UI

**File**: `src/components/settings/AuthSettings.tsx`

1. OIDC authority URL input
2. Client ID input
3. Test connection button
4. Enable/disable auth toggle (auth is optional)

### Step 7: Add Token to DICOMweb Requests

**File**: `src/lib/dicomweb/dicomwebService.ts`

1. Include access token in Authorization header for DICOMweb requests:
   ```typescript
   headers: {
     'Authorization': `Bearer ${accessToken}`
   }
   ```
2. Handle 401 responses (token expired → silent refresh → retry)

### Step 8: Add Tests

1. Test auth state management (login, logout, token refresh)
2. Test callback handling
3. Test token inclusion in DICOMweb requests
4. Test unauthenticated fallback (local file viewing without auth)

## Acceptance Criteria

- [ ] Users can log in via OpenID Connect
- [ ] User profile displayed when authenticated
- [ ] Access token included in DICOMweb requests
- [ ] Token refresh before expiry
- [ ] Auth is optional (local file viewing works without login)
- [ ] Auth settings configurable in settings panel
- [ ] Logout clears all session data
