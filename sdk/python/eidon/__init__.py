"""Eidon Python SDK — official client for the Eidon AI employee platform."""

from .client import AsyncEidon, Eidon
from .models import ChatMessage, ChatResponse, Employee

__version__ = "0.1.0"
__all__ = ["Eidon", "AsyncEidon", "ChatMessage", "ChatResponse", "Employee"]
