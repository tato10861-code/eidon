# Eidon Licensing Guide

Eidon uses a split licensing model. The hosted platform, web application, AI employee profiles, prompts, evaluation suites, design system, infrastructure, and server runtime are proprietary and are covered by the root [`LICENSE`](LICENSE). The SDKs and CLI are separately licensed under MIT and include their own license file in each distributable directory.

## Platform and commercial deployment

The platform may be viewed and evaluated from this repository, but production use, redistribution, embedding in a commercial offering, white-label resale, and private deployment require a signed commercial agreement with Eidon Labs. Commercial terms should be issued in an Order Form and must define deployment type, workspace capacity, usage limits, support/SLA, security responsibilities, data return/deletion, and any included integration or customization work.

The suggested packaging is a starting point rather than a promise of availability or value:

| Tier            | Intended use                                                     | Starting reference |
| --------------- | ---------------------------------------------------------------- | ------------------ |
| Startup         | Pilot or up to five workspaces                                   | $499/month         |
| Scale           | Multi-team SaaS or private VPC deployment                        | $2,499/month       |
| Enterprise      | Unlimited workspaces, SSO/SCIM, private or on-premise deployment | Custom             |
| White-label OEM | Rebrand and resell with agreed support and revenue share         | Custom             |

Prices must be validated through customer pilots. They do not replace a signed agreement.

## SDK and CLI

The Node.js, Python, and Go SDKs, and the CLI, are intended to help customers integrate with a licensed Eidon deployment. Their source directories contain the applicable MIT license. The MIT license does not grant a license to the proprietary platform, employee profiles, prompts, hosted API, trademarks, or commercial deployment rights.

## AI training data and customer content

Eidon does not obtain ownership of customer conversations, tool traces, documents, or other customer content merely because the platform stores or exports them. Any training-data programme must be opt-in, separately documented, anonymised or de-identified to an agreed standard, and subject to the customer's contractual data, privacy, security, and deletion rights. No marketing claim should imply that customer data is available for model training by default.

## Requesting a commercial proposal

Contact `enterprise@eidon.ai` with the company name, target workflow, expected workspaces and monthly volume, deployment preference, required integrations, security requirements, and whether white-label support is needed. The commercial contract and privacy/DPA documents must be reviewed before production access is granted.
