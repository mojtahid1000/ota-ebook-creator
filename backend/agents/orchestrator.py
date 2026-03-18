"""Agent Orchestrator - coordinates the 12-agent pipeline."""

import logging
from models.agent_state import EbookState
from agents.base_agent import BaseAgent, TokenBudgetExceeded

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """Manages the 12-agent pipeline with state passing."""

    def __init__(self):
        self.agents: dict[int, BaseAgent] = {}

    def register_agent(self, step: int, agent: BaseAgent):
        """Register an agent for a specific step."""
        self.agents[step] = agent
        logger.info(f"Registered Agent {step}: {agent.name} ({agent.model})")

    async def run_step(
        self, step: int, state: EbookState, user_input: dict = {}
    ) -> dict:
        """Run a single agent step. Returns result with updated state."""
        agent = self.agents.get(step)
        if not agent:
            return {
                "success": False,
                "error": f"No agent registered for step {step}",
                "state": state.model_dump(),
            }

        try:
            updated_state = await agent.run(state, user_input)
            return {
                "success": True,
                "agent_name": agent.name,
                "step": step,
                "state": updated_state.model_dump(),
                "tokens_used": updated_state.tokens_used,
            }
        except TokenBudgetExceeded as e:
            return {
                "success": False,
                "error": "token_budget_exceeded",
                "agent_name": e.agent_name,
                "tokens_used": e.tokens_used,
                "tokens_budget": e.tokens_budget,
                "tokens_needed": e.tokens_needed,
                "message": "টোকেন বাজেট শেষ হয়ে গেছে। অনুগ্রহ করে প্ল্যান আপগ্রেড করুন অথবা পরে আবার চেষ্টা করুন।",
                "state": state.model_dump(),
            }
        except Exception as e:
            logger.error(f"Agent {agent.name} failed: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "agent_name": agent.name,
                "state": state.model_dump(),
            }

    def get_agent_info(self) -> list[dict]:
        """Return info about all registered agents."""
        return [
            {
                "step": step,
                "name": agent.name,
                "model": agent.model,
                "description": agent.description,
                "estimated_tokens": agent.estimated_tokens,
            }
            for step, agent in sorted(self.agents.items())
        ]


# Singleton orchestrator
orchestrator = AgentOrchestrator()
