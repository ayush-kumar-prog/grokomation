/**
 * LLM Router for Grok API
 *
 * A unified router that provides a clean interface for all Grok AI capabilities.
 * Can be used as a standalone component throughout the application.
 *
 * Capabilities:
 * - Text Completion (chat)
 * - Vision (image understanding)
 * - Reasoning (extended thinking)
 * - Web Search
 * - X/Twitter Search
 * - Code Execution
 * - Image Generation
 *
 * Usage:
 *   import { llmRouter } from './services/llmRouter';
 *
 *   // Text completion
 *   const response = await llmRouter.chat({ messages: [...], model: 'grok-4' });
 *
 *   // Or use the unified execute method
 *   const result = await llmRouter.execute('chat', { messages: [...] });
 */

import grokApi, {
  type ChatMessage,
  type TextModel,
  type VisionModel,
  type ResponsesApiResponse,
  type StreamChunk,
} from './grokApi';

// ============================================================================
// Router Types
// ============================================================================

export type CapabilityType =
  | 'chat'
  | 'vision'
  | 'reasoning'
  | 'webSearch'
  | 'xSearch'
  | 'codeExecution'
  | 'imageGeneration';

// Request types for each capability
export interface ChatRequest {
  messages: ChatMessage[];
  model?: TextModel;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface VisionRequest {
  imageUrl: string;
  prompt: string;
  model?: VisionModel;
  detail?: 'auto' | 'low' | 'high';
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ReasoningRequest {
  prompt: string;
  systemPrompt?: string;
  reasoningEffort?: 'low' | 'high';
  temperature?: number;
  maxTokens?: number;
}

export interface WebSearchRequest {
  query: string;
  systemPrompt?: string;
  allowedDomains?: string[];
  excludedDomains?: string[];
  enableImageUnderstanding?: boolean;
}

export interface XSearchRequest {
  query: string;
  systemPrompt?: string;
  allowedHandles?: string[];
  excludedHandles?: string[];
  fromDate?: string;
  toDate?: string;
  enableImageUnderstanding?: boolean;
  enableVideoUnderstanding?: boolean;
}

export interface CodeExecutionRequest {
  prompt: string;
  systemPrompt?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  count?: number;
  responseFormat?: 'url' | 'b64_json';
}

// Union type for all requests
export type RouterRequest =
  | { type: 'chat'; params: ChatRequest }
  | { type: 'vision'; params: VisionRequest }
  | { type: 'reasoning'; params: ReasoningRequest }
  | { type: 'webSearch'; params: WebSearchRequest }
  | { type: 'xSearch'; params: XSearchRequest }
  | { type: 'codeExecution'; params: CodeExecutionRequest }
  | { type: 'imageGeneration'; params: ImageGenerationRequest };

// Unified response wrapper
export interface RouterResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  type: CapabilityType;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
  };
  citations?: string[];
}

// Extracted content types
export interface ExtractedChatContent {
  content: string;
  role: string;
}

export interface ExtractedSearchContent {
  content: string;
  citations: string[];
  inlineCitations?: Array<{
    id: string;
    url: string;
    title?: string;
  }>;
}

export interface ExtractedImageContent {
  images: Array<{
    url?: string;
    base64?: string;
    revisedPrompt?: string;
  }>;
}

// ============================================================================
// LLM Router Class
// ============================================================================

class LLMRouter {
  // ==========================================================================
  // Chat Completion
  // ==========================================================================

  async chat(request: ChatRequest): Promise<RouterResponse<ExtractedChatContent>> {
    try {
      const messages: ChatMessage[] = [];

      // Add system prompt if provided
      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }

      // Add the rest of the messages
      messages.push(...request.messages);

      const response = await grokApi.chatCompletion({
        model: request.model || 'grok-4-latest',
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
      });

      const choice = response.choices[0];

      return {
        success: true,
        type: 'chat',
        model: response.model,
        data: {
          content: choice.message.content,
          role: choice.message.role,
        },
        usage: {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      return {
        success: false,
        type: 'chat',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async *streamChat(
    request: ChatRequest
  ): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
    const messages: ChatMessage[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push(...request.messages);

    const stream = grokApi.streamChatCompletion({
      model: request.model || 'grok-4-latest',
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason === 'stop';
      yield { content, done };
    }
  }

  // ==========================================================================
  // Vision (Image Understanding)
  // ==========================================================================

  async vision(request: VisionRequest): Promise<RouterResponse<ExtractedChatContent>> {
    try {
      const response = await grokApi.vision(request.imageUrl, request.prompt, {
        model: request.model,
        detail: request.detail,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      });

      const choice = response.choices[0];

      return {
        success: true,
        type: 'vision',
        model: response.model,
        data: {
          content: choice.message.content,
          role: choice.message.role,
        },
        usage: {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      return {
        success: false,
        type: 'vision',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ==========================================================================
  // Reasoning (Extended Thinking)
  // ==========================================================================

  async reasoning(request: ReasoningRequest): Promise<RouterResponse<ExtractedChatContent>> {
    try {
      const response = await grokApi.reasoning(request.prompt, {
        systemPrompt: request.systemPrompt,
        reasoningEffort: request.reasoningEffort,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      });

      const choice = response.choices[0];

      return {
        success: true,
        type: 'reasoning',
        model: response.model,
        data: {
          content: choice.message.content,
          role: choice.message.role,
        },
        usage: {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          reasoningTokens: response.usage.reasoning_tokens,
        },
      };
    } catch (error) {
      return {
        success: false,
        type: 'reasoning',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ==========================================================================
  // Web Search
  // ==========================================================================

  async webSearch(request: WebSearchRequest): Promise<RouterResponse<ExtractedSearchContent>> {
    try {
      const response = await grokApi.webSearch(request.query, {
        systemPrompt: request.systemPrompt,
        allowedDomains: request.allowedDomains,
        excludedDomains: request.excludedDomains,
        enableImageUnderstanding: request.enableImageUnderstanding,
      });

      const content = this.extractResponseContent(response);

      return {
        success: true,
        type: 'webSearch',
        model: response.model,
        data: {
          content,
          citations: response.citations || [],
          inlineCitations: response.inline_citations?.map((c) => ({
            id: c.id,
            url: c.web_citation?.url || '',
            title: c.web_citation?.title,
          })),
        },
        citations: response.citations,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      return {
        success: false,
        type: 'webSearch',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ==========================================================================
  // X/Twitter Search
  // ==========================================================================

  async xSearch(request: XSearchRequest): Promise<RouterResponse<ExtractedSearchContent>> {
    try {
      const response = await grokApi.xSearch(request.query, {
        systemPrompt: request.systemPrompt,
        allowedHandles: request.allowedHandles,
        excludedHandles: request.excludedHandles,
        fromDate: request.fromDate,
        toDate: request.toDate,
        enableImageUnderstanding: request.enableImageUnderstanding,
        enableVideoUnderstanding: request.enableVideoUnderstanding,
      });

      const content = this.extractResponseContent(response);

      return {
        success: true,
        type: 'xSearch',
        model: response.model,
        data: {
          content,
          citations: response.citations || [],
          inlineCitations: response.inline_citations?.map((c) => ({
            id: c.id,
            url: c.x_citation?.url || c.web_citation?.url || '',
            title: c.x_citation?.username || c.web_citation?.title,
          })),
        },
        citations: response.citations,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      return {
        success: false,
        type: 'xSearch',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ==========================================================================
  // Code Execution
  // ==========================================================================

  async codeExecution(request: CodeExecutionRequest): Promise<RouterResponse<ExtractedChatContent>> {
    try {
      const response = await grokApi.executeCode(request.prompt, {
        systemPrompt: request.systemPrompt,
      });

      const content = this.extractResponseContent(response);

      return {
        success: true,
        type: 'codeExecution',
        model: response.model,
        data: {
          content,
          role: 'assistant',
        },
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      return {
        success: false,
        type: 'codeExecution',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ==========================================================================
  // Image Generation
  // ==========================================================================

  async imageGeneration(request: ImageGenerationRequest): Promise<RouterResponse<ExtractedImageContent>> {
    try {
      const response = await grokApi.generateImage(request.prompt, {
        n: request.count,
        responseFormat: request.responseFormat,
      });

      return {
        success: true,
        type: 'imageGeneration',
        model: 'grok-2-image',
        data: {
          images: response.data.map((img) => ({
            url: img.url,
            base64: img.b64_json,
            revisedPrompt: img.revised_prompt,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        type: 'imageGeneration',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ==========================================================================
  // Unified Execute Method
  // ==========================================================================

  async execute(request: RouterRequest): Promise<RouterResponse> {
    switch (request.type) {
      case 'chat':
        return this.chat(request.params);
      case 'vision':
        return this.vision(request.params);
      case 'reasoning':
        return this.reasoning(request.params);
      case 'webSearch':
        return this.webSearch(request.params);
      case 'xSearch':
        return this.xSearch(request.params);
      case 'codeExecution':
        return this.codeExecution(request.params);
      case 'imageGeneration':
        return this.imageGeneration(request.params);
      default:
        return {
          success: false,
          type: 'chat',
          error: 'Unknown capability type',
        };
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private extractResponseContent(response: ResponsesApiResponse): string {
    const messageOutput = response.output.find((item) => item.type === 'message');
    const textContent = messageOutput?.content?.find((c) => c.type === 'output_text');
    return textContent?.text || '';
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get available models for a specific capability
   */
  getAvailableModels(capability: CapabilityType): string[] {
    switch (capability) {
      case 'chat':
        return ['grok-4', 'grok-4-fast', 'grok-3-mini', 'grok-4-latest'];
      case 'vision':
        return ['grok-4', 'grok-4-fast'];
      case 'reasoning':
        return ['grok-3-mini'];
      case 'webSearch':
      case 'xSearch':
      case 'codeExecution':
        return ['grok-4-1-fast'];
      case 'imageGeneration':
        return ['grok-2-image'];
      default:
        return [];
    }
  }

  /**
   * Get the default model for a capability
   */
  getDefaultModel(capability: CapabilityType): string {
    switch (capability) {
      case 'chat':
        return 'grok-4-latest';
      case 'vision':
        return 'grok-4-fast';
      case 'reasoning':
        return 'grok-3-mini';
      case 'webSearch':
      case 'xSearch':
      case 'codeExecution':
        return 'grok-4-1-fast';
      case 'imageGeneration':
        return 'grok-2-image';
      default:
        return 'grok-4-latest';
    }
  }

  /**
   * Check if a capability supports streaming
   */
  supportsStreaming(capability: CapabilityType): boolean {
    return capability === 'chat';
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const llmRouter = new LLMRouter();
export default llmRouter;

// Also export the class for custom instances
export { LLMRouter };

// Re-export useful types from grokApi
export type { ChatMessage, StreamChunk };
