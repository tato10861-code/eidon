"""Eidon data models."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


@dataclass
class ChatMessage:
    role: Literal["user", "assistant"]
    content: str


@dataclass
class Employee:
    id: str
    name: str
    role: str


@dataclass
class ChatResponse:
    employee_id: str
    model: str
    text: str
    tokens: int
    latency_ms: int
    messages: list[ChatMessage] = field(default_factory=list)
