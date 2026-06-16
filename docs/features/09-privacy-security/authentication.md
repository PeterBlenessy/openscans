# Authentication (OpenID Connect)

**Status**: ❌ Not Implemented
**Category**: Privacy & Security
**Priority**: Tier 3 — Evaluate Later
**Present In**: OHIF, Weasis

## Description

Secure the application with user authentication using OpenID Connect (OIDC) or OAuth 2.0. This enables user identification, role-based access control, and audit logging of who viewed which studies.

## Benefits

- **Access control** — Restrict application access to authorized users only
- **Audit trail** — Log which user viewed which study, when — required for HIPAA compliance in multi-user settings
- **Role-based permissions** — Different access levels for radiologists, referring physicians, and administrators
- **Single sign-on (SSO)** — Integrate with institutional identity providers (Active Directory, Okta, etc.)

## Why It Matters for OpenScans

Authentication is primarily needed for multi-user deployments in institutional settings. For the current standalone use case (single user viewing local files), authentication adds no value. This becomes important if OpenScans adds DICOMweb/PACS integration or is deployed as a shared institutional viewer.

## Implementation Considerations

- OpenID Connect client library (oidc-client-ts)
- Login/logout flow with token management
- Protected routes requiring authentication
- User profile display and role information
- Integration with common identity providers
- Session management and token refresh
