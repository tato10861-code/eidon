# Security policy

Eidon runs AI employees that touch real customer conversations, data and tools. We treat
security as a product requirement, not a compliance checkbox.

## Reporting a vulnerability

**Do not open a public issue.** Report privately through
[GitHub Security Advisories](https://github.com/tato10861-code/eidon/security/advisories/new)
or email `security@eidon.ai`.

Include:

- A description of the issue and the affected component.
- Reproduction steps or a proof of concept.
- Impact assessment, if you can.
- Your name and a contact method for follow-up.

## Our commitment

| Step                   | Target                                   |
| ---------------------- | ---------------------------------------- |
| Acknowledgement        | 1 business day                           |
| Initial triage         | 3 business days                          |
| Remediation plan       | 10 business days                         |
| Coordinated disclosure | After the fix ships, by mutual agreement |

We will credit researchers who ask to be credited. We will not pursue legal action for
good-faith research that respects privacy, avoids data destruction and does not degrade
the service.

## Scope

In scope:

- Authentication and authorisation boundaries.
- Prompt injection that crosses a documented guardrail.
- Tool-scope escalation or cross-tenant data access.
- Secret leakage, SSRF, XSS and injection in the web application.
- Rate-limit and denial-of-service weaknesses in the chat runtime.

Out of scope:

- Reports generated only by automated scanners without a working exploit.
- Social engineering of Eidon staff.
- Denial of service through brute force or traffic volume.
- Issues in third-party services we integrate with (report them upstream).

## Secure development

- Secrets live in environment variables and are never committed.
- Tool access uses scoped OAuth and least privilege.
- The runtime enforces guardrails before outbound actions.
- Every decision is written to an append-only audit trail.
- Dependencies are reviewed weekly through Dependabot and CodeQL runs on every push.

## Supported versions

| Version               | Supported   |
| --------------------- | ----------- |
| `main`                | Yes         |
| Latest tagged release | Yes         |
| Older releases        | Best effort |
