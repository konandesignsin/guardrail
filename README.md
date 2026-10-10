# guardrail

Audit React/Vite apps exported from Lovable or Bolt for security and quality issues.

## GitHub Action (Recommended)

Use the reusable action in your workflows:

```yaml
name: Security Audit
on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: konandesigns/guardrail@v1
        with:
          path: '.'                    # Path to audit (default: '.')
          fail-on: 'high'              # Fail on high|medium|none (default: high)
          comment: 'true'              # Post PR comment (default: true)
          ignore: 'test/**,dist/**'    # Comma-separated globs to ignore
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Inputs:**
- `path` — Project path to audit (default: `.`)
- `fail-on` — Fail workflow on `high`, `medium`, or `none` (default: `high`)
- `comment` — Post/update PR comment with report (default: `true`)
- `ignore` — Comma-separated glob patterns to skip (default: `test-fixtures/**,node_modules/**`)
- `github-token` — Token for PR comments (default: `${{ github.token }}`)

**Outputs:**
- `total-findings` — Total number of findings
- `high-count` — Number of high severity findings

**Features:**
- Automatically posts/updates a single PR comment (no spam)
- Writes report to GitHub Actions job summary
- Fails workflow based on severity threshold

## Local CLI

```bash
npx tsx src/cli.ts <path-to-project>
```

Outputs a colored terminal report and writes `audit-report.md`.

## Adding checks

Create a new file in `src/checks/` that exports a `Check` object, then add it to the `CHECKS` array in `src/cli.ts` and `src/action.ts`.
