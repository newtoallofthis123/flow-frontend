import { apiClient } from './client'

export interface LLMRequest {
  system_prompt: string;
  user_messages: string[];
  provider: "ollama" | "gemini";
  model: "gemma3:1b" | "gemini-2.5-flash-lite";
}

export interface LLMResponse {
  content: string
  model: string
  metadata: {
    eval_count: number
    load_duration: number
    prompt_eval_count: number
    total_duration: number
  }
}

export const llmApi = {
  /**
   * Send a message to the LLM API
   */
  async sendMessage(request: LLMRequest): Promise<LLMResponse> {
    return apiClient.post<LLMResponse>('/api/llm/complete', request)
  },
}

