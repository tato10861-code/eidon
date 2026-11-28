# Eidon Python SDK

Official Python SDK for the [Eidon](https://eidon.ai) AI employee platform.

## Installation

```bash
pip install eidon
```

## Quick start

```python
from eidon import Eidon, ChatMessage

client = Eidon(api_key="ek_...")

# Stream response
for chunk in client.stream([ChatMessage(role="user", content="Draft a sales email")]):
    print(chunk, end="", flush=True)

# Full response
resp = client.chat([ChatMessage(role="user", content="Summarize this quarter")])
print(resp.text)
```

## Async

```python
from eidon import AsyncEidon, ChatMessage

client = AsyncEidon(api_key="ek_...")

async def main():
    async for chunk in client.stream([ChatMessage(role="user", content="Hello")]):
        print(chunk, end="", flush=True)
```

## Docs

Full documentation at [eidon.ai/docs](https://eidon.ai/docs).
