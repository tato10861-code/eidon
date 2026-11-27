"""Eidon synchronous and asynchronous clients."""

from __future__ import annotations

import json
from typing import Generator, AsyncGenerator, Iterator

import httpx

from .models import ChatMessage, ChatResponse, Employee


_DEFAULT_BASE_URL = "https://eidon.ai"


class _BaseClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = _DEFAULT_BASE_URL,
        timeout: float = 60.0,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "eidon-python/0.1.0",
        }

    def _build_payload(
        self,
        messages: list[ChatMessage],
        employee_id: str,
        workspace_id: str | None,
        conversation_id: str | None,
    ) -> dict:
        return {
            "employeeId": employee_id,
            **({"workspaceId": workspace_id} if workspace_id else {}),
            **({"conversationId": conversation_id} if conversation_id else {}),
            "messages": [{"role": m.role, "content": m.content} for m in messages],
        }

    @staticmethod
    def _parse_sse_line(line: str) -> dict | None:
        if not line.startswith("data: "):
            return None
        payload = line[6:]
        if payload == "[DONE]":
            return None
        try:
            return json.loads(payload)
        except json.JSONDecodeError:
            return None


class Eidon(_BaseClient):
    """Synchronous Eidon client."""

    def chat(
        self,
        messages: list[ChatMessage],
        employee_id: str = "ava",
        workspace_id: str | None = None,
        conversation_id: str | None = None,
    ) -> ChatResponse:
        """Send messages and collect the full response."""
        chunks = list(self.stream(messages, employee_id, workspace_id, conversation_id))
        text = "".join(c for c in chunks if isinstance(c, str))
        return ChatResponse(
            employee_id=employee_id,
            model="",
            text=text,
            tokens=0,
            latency_ms=0,
        )

    def stream(
        self,
        messages: list[ChatMessage],
        employee_id: str = "ava",
        workspace_id: str | None = None,
        conversation_id: str | None = None,
    ) -> Generator[str, None, None]:
        """Stream text deltas as they arrive."""
        payload = self._build_payload(messages, employee_id, workspace_id, conversation_id)
        with httpx.Client(timeout=self.timeout) as client:
            with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                headers=self._headers(),
                json=payload,
            ) as response:
                response.raise_for_status()
                for raw in response.iter_lines():
                    event = self._parse_sse_line(raw)
                    if event and event.get("type") == "delta":
                        yield event.get("text", "")

    def list_employees(self) -> list[Employee]:
        """List all available AI employees."""
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(
                f"{self.base_url}/api/employees",
                headers=self._headers(),
            )
            resp.raise_for_status()
            data = resp.json()
            return [
                Employee(id=e["id"], name=e["name"], role=e.get("role", ""))
                for e in data.get("employees", [])
            ]


class AsyncEidon(_BaseClient):
    """Asynchronous Eidon client (requires httpx[asyncio])."""

    async def chat(
        self,
        messages: list[ChatMessage],
        employee_id: str = "ava",
        workspace_id: str | None = None,
        conversation_id: str | None = None,
    ) -> ChatResponse:
        """Send messages and collect the full response asynchronously."""
        text_parts: list[str] = []
        async for chunk in self.stream(messages, employee_id, workspace_id, conversation_id):
            text_parts.append(chunk)
        return ChatResponse(
            employee_id=employee_id,
            model="",
            text="".join(text_parts),
            tokens=0,
            latency_ms=0,
        )

    async def stream(
        self,
        messages: list[ChatMessage],
        employee_id: str = "ava",
        workspace_id: str | None = None,
        conversation_id: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream text deltas asynchronously."""
        payload = self._build_payload(messages, employee_id, workspace_id, conversation_id)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                headers=self._headers(),
                json=payload,
            ) as response:
                response.raise_for_status()
                async for raw in response.aiter_lines():
                    event = self._parse_sse_line(raw)
                    if event and event.get("type") == "delta":
                        yield event.get("text", "")

    async def list_employees(self) -> list[Employee]:
        """List all available AI employees asynchronously."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(
                f"{self.base_url}/api/employees",
                headers=self._headers(),
            )
            resp.raise_for_status()
            data = resp.json()
            return [
                Employee(id=e["id"], name=e["name"], role=e.get("role", ""))
                for e in data.get("employees", [])
            ]
