# Repo Security Audit — 2026-06-24

Generated for `PeterBlenessy/openscans` against the checks in
[`scripts/security-audit.sh`](../scripts/security-audit.sh). Checklist +
remediation recipes: [`docs/security-audit-checklist.md`](../docs/security-audit-checklist.md).

> Methodology note: compiled from the GitHub API (branch state) and static
> analysis of `.github/workflows/` + `git log` signing state. Admin-scoped
> checks (secret age, default-token policy, branch-protection sub-config) are
> marked **Not assessed** — re-run authenticated as an admin to fill them in:
> `scripts/security-audit.sh PeterBlenessy/openscans`

**Repositories scanned (1):** `PeterBlenessy/openscans`

| Severity | Count |
| --- | --- |
| 🔴 Critical | 0 |
| 🟠 High | 1 |
| 🟡 Medium | 0 |
| 🔵 Low | 1 |
| ⚪ Info | 0 |
| **Total** | **2** |

## Prioritized findings

### 🟠 High

1. **[`PeterBlenessy/openscans`] Default branch `main` has NO branch protection rule**  
   - _Check:_ `branch-protection`  
   - _Fix here:_ https://github.com/PeterBlenessy/openscans/settings/branches  
   - _Remediation:_ `main` reports `protected: false` — anyone with write can push directly, force-push over history, or delete it, and code can merge unreviewed. Add a protection rule: require a PR before merge, ≥1 approval, require the `build-and-test` status check, block force-push + deletion, include administrators, and require signed commits.

### 🔵 Low

1. **[`PeterBlenessy/openscans`] Recent commits on `main` are unsigned/unverified**  
   - _Check:_ `gpg-signing`  
   - _Fix here:_ https://github.com/PeterBlenessy/openscans/commits/main  
   - _Remediation:_ Every sampled recent commit on `main` is unsigned. Have contributors sign commits (`git config commit.gpgsign true` with a GPG/SSH key on file), then enable "Require signed commits" once the branch protection rule above exists.

## Clean checks

- **Workflows** — `ci.yml` and `release.yml` both declare least-privilege `permissions:` blocks (`contents: read` at the top, `contents: write` only on the release jobs that create/upload the release). No `pull_request_target` / `workflow_run` triggers. No actions pinned to a moving `@master`/`@main` ref. No workflow findings.

## Not assessed (need an admin-scoped token)

- **Secret rotation age** — any Actions secret older than 180 days.
- **Default `GITHUB_TOKEN` policy** — `default_workflow_permissions` (read vs write) and the "Actions can approve PRs" setting.

## Notes

- Admin-scoped checks are skipped without admin on the repo — absence of a finding there means *not assessed*, not *passed*.
- `gpg-signing` findings sample the latest commits; a commit shows unverified when its signer's public key isn't on GitHub.
