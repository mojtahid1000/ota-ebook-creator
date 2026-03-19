/**
 * API client - uses Next.js API routes (no external backend needed).
 */

export async function callAgent(
  step: number,
  projectId: string,
  userId: string,
  userInput: Record<string, unknown> = {},
  stateData: Record<string, unknown> = {},
) {
  const response = await fetch("/api/agents/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step,
      project_id: projectId,
      user_id: userId,
      user_input: userInput,
      state_data: stateData,
    }),
  });

  if (!response.ok) {
    // Try to get error details from body
    try {
      const errorBody = await response.json();
      return { success: false, error: errorBody.error || `Agent call failed: ${response.statusText}` };
    } catch {
      return { success: false, error: `Agent call failed: ${response.status} ${response.statusText}` };
    }
  }

  return response.json();
}

export async function getSubNiches(mainNiche: string) {
  const response = await fetch(`/api/agents/sub-niches?main_niche=${encodeURIComponent(mainNiche)}`);
  return response.json();
}
