# Project Governance

## Overview

Eidon is developed and maintained by its core team. This document describes how
decisions are made, how contributions are accepted, and how the project is steered.

## Roles

### Maintainers

Maintainers are responsible for:

- Reviewing and merging pull requests
- Triaging issues and setting priorities
- Releasing new versions
- Enforcing the Code of Conduct
- Steering the technical direction

Maintainers have write access to the repository. The current maintainers are listed
in [CODEOWNERS](.github/CODEOWNERS).

### Contributors

Anyone who opens an issue, submits a pull request, improves documentation, or
participates in discussions is a contributor. Contributions do not require any
prior approval — just follow the guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

### Users

Users are anyone who runs Eidon in production, deploys it via Vercel, or integrates
its API. User feedback is the most important signal for prioritisation.

## Decision-making

Routine decisions (bug fixes, dependency updates, minor features) are made by any
maintainer and merged after one approval. Changes that touch:

- the AI runtime protocol or guardrail semantics
- the public API surface or webhook schema
- pricing, billing, or multi-tenancy isolation
- security-sensitive paths

...require two maintainer approvals and a written rationale in the PR description.

Architectural changes that affect the whole system require a written design document
(added to `docs/`) and are open for community comment for at least five business days
before merging.

## Versioning

Eidon follows [Semantic Versioning](https://semver.org/):

- **Patch** (`0.x.Z`): bug fixes, internal refactors, dependency bumps
- **Minor** (`0.Y.0`): new features that do not break existing integrations
- **Major** (`X.0.0`): breaking changes to the API, schema, or runtime contract

All notable changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Security

Security vulnerabilities are handled privately through GitHub Security Advisories.
See [SECURITY.md](SECURITY.md) for the full policy and response timeline.

## Code of Conduct

All participants in the Eidon community are expected to follow the
[Code of Conduct](CODE_OF_CONDUCT.md). Violations may be reported to
**conduct@eidon.ai**.

## Amendments

Changes to this governance document follow the same two-maintainer-approval process
as architectural changes.
