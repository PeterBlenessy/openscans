# Code Signing for Desktop Builds

This document explains how to configure code signing for macOS and Windows desktop builds.

## Overview

Code signing is **optional** but **recommended** for production releases:
- **macOS**: Required for distribution outside Mac App Store (prevents "unidentified developer" warnings)
- **Windows**: Recommended to avoid SmartScreen warnings
- **Linux**: Not required

## macOS Code Signing

### Prerequisites

1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate** from Apple Developer portal

### Steps to Configure

#### 1. Export Your Certificate

On your Mac with the certificate installed:

```bash
# Open Keychain Access
# Find "Developer ID Application: Your Name"
# Right-click → Export "Developer ID Application..."
# Save as .p12 file with a password
```

#### 2. Convert to Base64

```bash
base64 -i certificate.p12 -o certificate.txt
# Copy contents of certificate.txt
```

#### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Required |
|------------|-------|----------|
| `APPLE_CERTIFICATE` | Base64 encoded .p12 certificate | Yes |
| `APPLE_CERTIFICATE_PASSWORD` | Password for .p12 file | Yes |
| `APPLE_SIGNING_IDENTITY` | Your signing identity (e.g., "Developer ID Application: John Doe (TEAM123)") | Yes |
| `APPLE_ID` | Your Apple ID email | For notarization |
| `APPLE_PASSWORD` | App-specific password (not your Apple ID password!) | For notarization |
| `APPLE_TEAM_ID` | Your Team ID (10 character alphanumeric) | For notarization |

#### 4. Get App-Specific Password for Notarization

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Under "Security" → "App-Specific Passwords" → Generate new password
4. Save this password as `APPLE_PASSWORD` secret

#### 5. Find Your Signing Identity

```bash
security find-identity -v -p codesigning
# Look for "Developer ID Application: Your Name (TEAMID)"
# Copy the exact string for APPLE_SIGNING_IDENTITY
```

### Tauri Configuration

Ensure your `src-tauri/tauri.conf.json` has:

```json
{
  "tauri": {
    "bundle": {
      "identifier": "com.yourcompany.openscans",
      "macOS": {
        "entitlements": null,
        "exceptionDomain": "",
        "frameworks": [],
        "providerShortName": null,
        "signingIdentity": null
      }
    }
  }
}
```

The `signingIdentity: null` tells Tauri to use the environment variable.

## Windows Code Signing

### Prerequisites

1. **Code Signing Certificate** from a trusted CA (DigiCert, Sectigo, etc.)
2. Certificate in `.pfx` format

### Steps to Configure

#### 1. Convert Certificate to Base64

```powershell
# PowerShell
$cert = [System.IO.File]::ReadAllBytes("certificate.pfx")
$base64 = [System.Convert]::ToBase64String($cert)
$base64 | Out-File certificate.txt
# Copy contents of certificate.txt
```

Or on macOS/Linux:
```bash
base64 -i certificate.pfx -o certificate.txt
```

#### 2. Configure GitHub Secrets

| Secret Name | Value | Required |
|------------|-------|----------|
| `WINDOWS_CERTIFICATE` | Base64 encoded .pfx certificate | Yes |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password for .pfx file | Yes |

### Tauri Configuration

Ensure your `src-tauri/tauri.conf.json` has:

```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": "http://timestamp.digicert.com"
      }
    }
  }
}
```

## Tauri Updater Signing (Optional)

If you want to enable Tauri's built-in auto-updater with signature verification:

### Generate Key Pair

```bash
# Install Tauri CLI
cargo install tauri-cli

# Generate keypair
cargo tauri signer generate -w ~/.tauri/openscans.key

# This creates two files:
# - Private key: ~/.tauri/openscans.key
# - Public key: displayed in terminal
```

### Configure GitHub Secrets

| Secret Name | Value |
|------------|-------|
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of the private key file |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password you set when generating the key |

### Add Public Key to Tauri Config

In `src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.myapp.com/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

## Verification

After pushing a tag, check the GitHub Actions workflow:

### macOS
- Build logs should show "Signing application..."
- Check the .dmg file can be opened without warnings

### Windows
- Build logs should show "Signing executable..."
- Check the .exe file properties show your certificate

## Troubleshooting

### macOS: "certificate not trusted"

Your certificate chain may be incomplete. Ensure you have:
1. Apple Worldwide Developer Relations Certificate
2. Your Developer ID Application certificate

Both should be in your Keychain.

### Windows: "Object or property not found"

The certificate may have expired or the password is incorrect.

### Builds succeed but apps aren't signed

The secrets are likely not set or are incorrect. The workflow will build successfully but skip signing if secrets are missing.

## Cost Considerations

| Platform | Requirement | Cost |
|----------|------------|------|
| **macOS** | Apple Developer Program | $99/year |
| **Windows** | Code Signing Certificate | $200-500/year |
| **Linux** | None | Free |

## Alternatives

### For Testing/Development

If you don't need signed builds:
- macOS: Users can right-click → Open to bypass Gatekeeper
- Windows: Users can click "More info" → "Run anyway"
- Linux: No signing required

### For Open Source Projects

Consider:
- Publishing builds as "unsigned" with clear instructions
- Using GitHub Releases with checksums for verification
- Community members can verify source and build themselves

## Security Best Practices

1. **Never commit certificates** to version control
2. **Use strong passwords** for certificate files
3. **Rotate certificates** before expiration
4. **Limit access** to GitHub repository secrets
5. **Enable 2FA** on Apple ID and GitHub account
6. **Review workflow runs** for any suspicious activity

## References

- [Tauri Code Signing Guide](https://tauri.app/v1/guides/distribution/sign-macos)
- [Apple Developer Documentation](https://developer.apple.com/support/code-signing/)
- [Microsoft SignTool Documentation](https://docs.microsoft.com/en-us/windows/win32/seccrypto/signtool)
