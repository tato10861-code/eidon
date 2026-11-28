"""Tests for the Eidon Python SDK."""

import json
import pytest
import respx
import httpx

from eidon import Eidon, AsyncEidon, ChatMessage


BASE = "https://eidon.test"
KEY = "ek_test_key"


def _sse(*events: dict) -> bytes:
    lines = []
    for e in events:
        lines.append(f"data: {json.dumps(e)}\n\n")
    return "".join(lines).encode()


@respx.mock
def test_sync_stream_yields_deltas():
    respx.post(f"{BASE}/api/chat").mock(
        return_value=httpx.Response(
            200,
            content=_sse(
                {"type": "meta", "model": "test", "mode": "live"},
                {"type": "delta", "text": "Hello"},
                {"type": "delta", "text": " world"},
                {"type": "done", "usage": {"tokens": 5, "latencyMs": 100}},
            ),
            headers={"Content-Type": "text/event-stream"},
        )
    )
    client = Eidon(api_key=KEY, base_url=BASE)
    chunks = list(client.stream([ChatMessage(role="user", content="hi")]))
    assert chunks == ["Hello", " world"]


@respx.mock
def test_sync_chat_collects_full_text():
    respx.post(f"{BASE}/api/chat").mock(
        return_value=httpx.Response(
            200,
            content=_sse(
                {"type": "delta", "text": "Hi"},
                {"type": "delta", "text": "!"},
            ),
            headers={"Content-Type": "text/event-stream"},
        )
    )
    client = Eidon(api_key=KEY, base_url=BASE)
    resp = client.chat([ChatMessage(role="user", content="hey")])
    assert resp.text == "Hi!"


@respx.mock
def test_list_employees():
    respx.get(f"{BASE}/api/employees").mock(
        return_value=httpx.Response(
            200,
            json={"employees": [{"id": "ava", "name": "Ava", "role": "Assistant"}]},
        )
    )
    client = Eidon(api_key=KEY, base_url=BASE)
    employees = client.list_employees()
    assert len(employees) == 1
    assert employees[0].id == "ava"


@respx.mock
async def test_async_stream_yields_deltas():
    respx.post(f"{BASE}/api/chat").mock(
        return_value=httpx.Response(
            200,
            content=_sse(
                {"type": "delta", "text": "Async"},
                {"type": "delta", "text": "!"},
            ),
            headers={"Content-Type": "text/event-stream"},
        )
    )
    client = AsyncEidon(api_key=KEY, base_url=BASE)
    chunks = [c async for c in client.stream([ChatMessage(role="user", content="go")])]
    assert chunks == ["Async", "!"]
