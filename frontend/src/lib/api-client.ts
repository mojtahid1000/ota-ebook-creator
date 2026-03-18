/**
 * API client for communicating with the Python backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function callAgent(
  step: number,
  projectId: string,
  userId: string,
  userInput: Record<string, unknown> = {},
  stateData: Record<string, unknown> = {},
  aiProvider: string = "claude"
) {
  const response = await fetch(`${API_URL}/api/agents/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: projectId,
      user_id: userId,
      step,
      user_input: userInput,
      ai_provider: aiProvider,
      state_data: stateData,
    }),
  });

  if (!response.ok) {
    throw new Error(`Agent call failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getAgentInfo() {
  const response = await fetch(`${API_URL}/api/agents/info`);
  return response.json();
}

export async function healthCheck() {
  const response = await fetch(`${API_URL}/health`);
  return response.json();
}
