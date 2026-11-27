# Eidon Node.js SDK

Official TypeScript/Node.js SDK for the [Eidon](https://eidon.ai) AI employee platform.

## Installation

```bash
npm install eidon
```

## Quick start

```typescript
import { EidonClient } from "eidon";

const client = new EidonClient({ apiKey: "ek_..." });

// Stream response
for await (const chunk of client.stream([{ role: "user", content: "Draft a sales email" }])) {
  if (chunk.type === "delta") process.stdout.write(chunk.text ?? "");
}

// Full response
const resp = await client.chat([{ role: "user", content: "Summarize this quarter" }]);
console.log(resp.text);
```

## Docs

Full documentation at [eidon.ai/docs](https://eidon.ai/docs).
