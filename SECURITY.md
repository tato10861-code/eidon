# Security Policy

## Supported versions

| Version | Supported                    |
| ------- | ---------------------------- |
| 0.3.x   | ✅ Yes                       |
| 0.2.x   | ✅ Yes (critical fixes only) |
| < 0.2   | ❌ No                        |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Send a detailed report to **security@eidon.ai** with:

1. A description of the vulnerability and its potential impact
2. Steps to reproduce the issue
3. Any relevant log output, screenshots, or proof-of-concept code

We will acknowledge your report within **48 hours** and aim to release a patch
within **14 days** for critical issues. We follow [Responsible Disclosure]
(https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure): credit is
given in the release notes unless you request anonymity.

If the issue is critical and you need a faster response, include
`[URGENT]` in the subject line.

## Security controls

- **Content-Security-Policy** — strict CSP headers on all pages
- **HSTS** — `Strict-Transport-Security` with 2-year max-age and preload
- **HMAC-SHA256 webhooks** — all outbound webhook deliveries are signed;
  verify with `verifyWebhookSignature()` in `lib/webhooks.ts`
- **API key hashing** — API keys are stored as SHA-256 digests; plaintext
  is never persisted
- **Rate limiting** — per-IP sliding-window rate limits on all public endpoints
- **Admin API** — `/api/admin/*` requires a shared secret (`ADMIN_API_KEY`)
  delivered as an `x-admin-key` header; timing-safe comparison is used
- **Audit log** — all workspace mutations are recorded in the `audit_log` table
- **CodeQL** — static analysis runs on every push via GitHub Actions
- **Dependabot** — automated dependency updates with security advisory alerts
- **Dependency review** — high-severity vulnerabilities block PR merges

## Scope

The following are **in scope**:

- API endpoints under `/api/`
- Authentication and session management
- Webhook signature verification
- Database access controls
- SDK packages: `eidon` (npm), `eidon` (PyPI), `sdk/go`

The following are **out of scope**:

- Issues in third-party dependencies (please report to them directly)
- Denial-of-service attacks against rate-limited endpoints
- Attacks that require physical access to a server
