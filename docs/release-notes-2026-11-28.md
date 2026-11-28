# Release notes — 2026-11-28

## Vercel deployment record

- Vercel project: `eidon` (`prj_T1U1roR11YdGqRX11eQjmh1Skh7D`)
- Team: `team_C9bVcXcO2lnhudmkPThPSvZI`
- Production domain: https://eidon-ta-to.vercel.app
- Last confirmed READY production deployment before the latest checkpoint: `dpl_368TpbsiuyeNapoZSJ4TjpkBFTgc`, commit `6adc095`.
- The latest pushed commit is `6bd92a0`.
- Vercel MCP deployment creation returned HTTP 402 `api-deployments-free-per-day`, with a retry interval of 86400 seconds. The local `vercel` CLI fallback was unavailable because the CLI is not installed in the sandbox.

These statements are operational observations from the Vercel project/deployment tools, not a claim that commit `6bd92a0` is currently live in Production.

The deployment listing was checked after the previous push and returned no Production deployment for
`04616f2`. The current hardening checkpoint `6bd92a0` also requires a new READY deployment before
it can be called live. The latest confirmed READY Production deployment remains commit
`6adc095e7719fb084cc073ce7fc4a2c6773b7326`.
