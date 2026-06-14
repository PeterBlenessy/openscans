# Releasing OpenScans Desktop Apps

OpenScans ships as a web app **and** as Tauri desktop apps (macOS, Windows,
Linux). This document describes the CI release pipeline, code signing, and the
in-app auto-updater.

> The web-browser build is unaffected by any of this. All desktop-only code
> (auto-update) is guarded by `isTauri()` and only ever reaches the backend via
> `invoke()`, so `pnpm build` / the deployed web bundle never touch a Tauri API.

## How a release happens

1. Bump the version in `package.json` (and ideally `src-tauri/tauri.conf.json`
   + `src-tauri/Cargo.toml`, though CI rewrites all three from the tag anyway).
2. Push a tag: `git tag v0.6.0 && git push origin v0.6.0`.
3. `.github/workflows/release.yml` runs:
   - **tests** — reuses `ci.yml` (web build + unit tests) as a gate.
   - **create-release** — creates a draft GitHub Release (`alpha`/`beta`/`rc`
     tags are flagged as prereleases).
   - **build-tauri** — builds installers for macOS (Intel + Apple Silicon),
     Windows, and Linux, and uploads them to the release.
   - **publish-release** — flips the draft to published.

**Everything works with zero secrets configured.** Without signing secrets the
builds are simply *unsigned* (macOS users right-click → Open on first launch)
and no auto-update manifest (`latest.json`) is produced. Add the secrets below
when you're ready and the next tagged release upgrades automatically.

## GitHub Actions secrets

All secrets are optional. Configure them under
**Settings → Secrets and variables → Actions**.

### macOS code signing + notarization

| Secret | Purpose |
| --- | --- |
| `APPLE_CERTIFICATE` | Base64 of your "Developer ID Application" `.p12`. Also acts as the on/off switch (`ENABLE_CODE_SIGNING`). |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the `.p12`. |
| `APPLE_SIGNING_IDENTITY` | e.g. `Developer ID Application: Your Name (TEAMID)`. |
| `APPLE_TEAM_ID` | Your Apple Developer Team ID. |
| `APPLE_ID` | Apple ID email used for notarization. |
| `APPLE_PASSWORD` | App-specific password for notarization. |

If `APPLE_CERTIFICATE` is unset, signing is skipped and the build still succeeds.

> Windows signing is not wired up yet — Windows installers ship unsigned. Add an
> `azure-trusted-signing` / cert step to the `build-tauri` job when needed.

### Tauri auto-updater signing

The updater verifies every downloaded update against a **minisign** key pair.
The public half is baked into the app; the private half signs releases in CI.

| Secret | Purpose |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | The minisign private key. Its presence also switches on `createUpdaterArtifacts` in CI. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the private key (leave unset/empty if you generated it without one). |

## One-time: activate the auto-updater

The updater is fully wired but **dormant** until you generate a key pair and
publish the public half. Until then, `check_for_update` returns "no update" and
the desktop app runs normally.

1. Generate a key pair (run locally, once):

   ```bash
   pnpm tauri signer generate -w ~/.tauri/openscans-updater.key
   ```

   This prints a **public key** and writes the **private key** to the path. If
   you set a password, remember it.

2. Paste the **public key** into `src-tauri/tauri.conf.json` →
   `plugins.updater.pubkey` (it currently holds an empty string placeholder),
   then commit:

   ```jsonc
   "plugins": {
     "updater": {
       "endpoints": ["https://github.com/PeterBlenessy/openscans/releases/latest/download/latest.json"],
       "pubkey": "<PASTE PUBLIC KEY HERE>"
     }
   }
   ```

3. Add the **private key** (the file contents) as the `TAURI_SIGNING_PRIVATE_KEY`
   secret, and its password (if any) as `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

4. Tag the next release. CI now emits a signed `latest.json`; installed desktop
   apps check it on launch and offer "Install & Restart".

> Keep the private key safe and out of git. If it leaks, generate a new pair,
> update the committed `pubkey`, and rotate the secret — old installs will then
> need a manual reinstall to pick up the new key.

## How the in-app updater works

- Rust (`src-tauri/src/lib.rs`) exposes `check_for_update` and `install_update`
  commands backed by `tauri-plugin-updater`.
- The frontend (`src/lib/utils/updater.ts` + `src/components/UpdateNotification.tsx`)
  checks ~4s after launch, and shows a bottom-right banner if a newer version is
  available. "Install & Restart" downloads, verifies, installs, and relaunches.
- Endpoint: `releases/latest/download/latest.json`, which GitHub resolves to the
  latest **non-prerelease** release — so stable users never auto-jump to an
  `alpha`/`beta`/`rc` build.
