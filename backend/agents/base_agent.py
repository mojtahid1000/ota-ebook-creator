"""Base agent class for all 12 specialized agents."""

import time
import logging
from abc import ABC, abstractmethod
from typing import Any
from anthropic import Anthropic
from openai import OpenAI
from models.agent_state import EbookState

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Base class that all 12 agents inherit from."""

    name: str = "BaseAgent"
    model: str = "claude-sonnet-4-6-20250514"
    description: str = ""
    step_number: int = 0
    estimated_tokens: int = 1000

    def __init__(self):
        self.anthropic_client = Anthropic()
        self.openai_client = OpenAI()

    @abstractmethod
    def get_system_prompt(self, state: EbookState) -> str:
        """Return the system prompt for this agent."""
        pass

    @abstractmethod
    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        """Return the user prompt based on state and user input."""
        pass

    @abstractmethod
    def parse_response(self, response: str, state: EbookState) -> EbookState:
        """Parse AI response and update state."""
        pass

    def check_token_budget(self, state: EbookState) -> bool:
        """Check if we have enough tokens to proceed."""
        return (state.tokens_budget - state.tokens_used) >= self.estimated_tokens

    def call_ai(self, state: EbookState, user_input: dict) -> str:
        """Call the AI provider (Claude or OpenAI) and return response."""
        system_prompt = self.get_system_prompt(state)
        user_prompt = self.get_user_prompt(state, user_input)

        start_time = time.time()

        if state.ai_provider == "openai":
            response = self._call_openai(system_prompt, user_prompt)
        else:
            response = self._call_claude(system_prompt, user_prompt)

        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(
            f"Agent {self.name} completed in {duration_ms}ms "
            f"({len(response)} chars)"
        )

        return response

    def _call_claude(self, system_prompt: str, user_prompt: str) -> str:
        """Call Claude API."""
        message = self.anthropic_client.messages.create(
            model=self.model,
            max_tokens=8192,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return message.content[0].text

    def _call_openai(self, system_prompt: str, user_prompt: str) -> str:
        """Call OpenAI API."""
        # Map Claude model names to OpenAI equivalents
        openai_model = "gpt-4o"

        response = self.openai_client.chat.completions.create(
            model=openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=8192,
        )
        return response.choices[0].message.content or ""

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        """Execute this agent: check budget, call AI, parse response, update state."""
        logger.info(f"Running Agent {self.step_number}: {self.name}")

        # Check token budget
        if not self.check_token_budget(state):
            logger.warning(
                f"Agent {self.name}: insufficient token budget. "
                f"Used: {state.tokens_used}, Budget: {state.tokens_budget}, "
                f"Needed: {self.estimated_tokens}"
            )
            raise TokenBudgetExceeded(
                agent_name=self.name,
                tokens_used=state.tokens_used,
                tokens_budget=state.tokens_budget,
                tokens_needed=self.estimated_tokens,
            )

        # Call AI
        response = self.call_ai(state, user_input)

        # Estimate tokens used (rough: 1 token ~= 4 chars)
        estimated_usage = (len(response) + len(self.get_user_prompt(state, user_input))) // 4
        state.tokens_used += estimated_usage

        # Parse and update state
        state = self.parse_response(response, state)
        state.current_step = self.step_number + 1  # Move to next step

        from datetime import datetime
        state.updated_at = datetime.now()

        logger.info(
            f"Agent {self.name} done. Tokens used: {state.tokens_used}/{state.tokens_budget}"
        )

        return state


class TokenBudgetExceeded(Exception):
    """Raised when token budget is insufficient for the next agent."""

    def __init__(
        self, agent_name: str, tokens_used: int, tokens_budget: int, tokens_needed: int
    ):
        self.agent_name = agent_name
        self.tokens_used = tokens_used
        self.tokens_budget = tokens_budget
        self.tokens_needed = tokens_needed
        super().__init__(
            f"Agent {agent_name}: Token budget exceeded. "
            f"Used: {tokens_used}, Budget: {tokens_budget}, Needed: {tokens_needed}"
        )
