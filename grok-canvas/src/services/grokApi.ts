/**
 * Grok API Client
 *
 * A comprehensive client for interacting with the xAI Grok API.
 * Supports text completion, vision, reasoning, web search, X search,
 * code execution, and image generation.
 */

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = 'https://api.x.ai/v1';
const API_KEY = import.meta.env.VITE_XAI_API_KEY || '';

// ============================================================================
// Type Definitions
// ============================================================================

// Models
export type TextModel = 'grok-4' | 'grok-4-fast' | 'grok-3-mini' | 'grok-4-latest';
export type ReasoningModel = 'grok-3-mini';
export type VisionModel = 'grok-4' | 'grok-4-fast';
export type SearchModel = 'grok-4-1-fast';
export type ImageModel = 'grok-2-image-1212';

// Message Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string | ContentPart[];
}

export interface ContentPart {
  type: 'input_text' | 'input_image';
  text?: string;
  image_url?: string;
  detail?: 'auto' | 'low' | 'high';
}

// Request Types
export interface ChatCompletionRequest {
  model: TextModel;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface VisionRequest {
  model: VisionModel;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ReasoningRequest {
  model: ReasoningModel;
  messages: ChatMessage[];
  reasoning_effort?: 'low' | 'high';
  temperature?: number;
  max_tokens?: number;
}

export interface WebSearchTool {
  type: 'web_search';
  filters?: {
    allowed_domains?: string[];
    excluded_domains?: string[];
  };
  enable_image_understanding?: boolean;
}

export interface XSearchTool {
  type: 'x_search';
  allowed_x_handles?: string[];
  excluded_x_handles?: string[];
  from_date?: string;
  to_date?: string;
  enable_image_understanding?: boolean;
  enable_video_understanding?: boolean;
}

export interface CodeInterpreterTool {
  type: 'code_interpreter';
}

export type ResponseTool = WebSearchTool | XSearchTool | CodeInterpreterTool;

export interface ResponsesApiRequest {
  model: SearchModel;
  input: ChatMessage[];
  tools?: ResponseTool[];
  include?: string[];
  store?: boolean;
}

export interface ImageGenerationRequest {
  model: ImageModel;
  prompt: string;
  n?: number;
  response_format?: 'url' | 'b64_json';
}

// Response Types
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      reasoning_content?: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    reasoning_tokens?: number;
  };
}

export interface ResponsesApiResponse {
  id: string;
  object: string;
  created_at: number;
  model: string;
  output: ResponseOutputItem[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    output_tokens_details?: {
      reasoning_tokens?: number;
    };
  };
  citations?: string[];
  inline_citations?: InlineCitation[];
}

export interface ResponseOutputItem {
  type: 'message' | 'reasoning' | 'tool_call';
  content?: OutputContent[];
  id?: string;
  name?: string;
  arguments?: string;
}

export interface OutputContent {
  type: 'output_text' | 'reasoning';
  text?: string;
}

export interface InlineCitation {
  id: string;
  web_citation?: {
    url: string;
    title?: string;
  };
  x_citation?: {
    url: string;
    username?: string;
  };
}

export interface ImageGenerationResponse {
  created: number;
  data: {
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }[];
}

// Streaming Types
export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
      reasoning_content?: string;
    };
    finish_reason: string | null;
  }[];
}

// ============================================================================
// API Client
// ============================================================================

class GrokApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string = API_KEY, baseUrl: string = API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Grok API Error: ${error.error?.message || error.message || response.statusText}`);
    }

    return response.json();
  }

  // ==========================================================================
  // Text Completion (Chat)
  // ==========================================================================

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.request<ChatCompletionResponse>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        stream: false,
      }),
    });
  }

  async *streamChatCompletion(
    request: ChatCompletionRequest
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const url = `${this.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Grok API Error: ${error.error?.message || error.message}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data);
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  // ==========================================================================
  // Vision (Image Understanding)
  // ==========================================================================

  async vision(
    imageUrl: string,
    prompt: string,
    options: {
      model?: VisionModel;
      detail?: 'auto' | 'low' | 'high';
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<ChatCompletionResponse> {
    const {
      model = 'grok-4-fast',
      detail = 'auto',
      systemPrompt,
      temperature = 0.7,
      maxTokens,
    } = options;

    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({
      role: 'user',
      content: [
        {
          type: 'input_image',
          image_url: imageUrl,
          detail,
        },
        {
          type: 'input_text',
          text: prompt,
        },
      ],
    });

    return this.request<ChatCompletionResponse>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });
  }

  // ==========================================================================
  // Reasoning
  // ==========================================================================

  async reasoning(
    prompt: string,
    options: {
      systemPrompt?: string;
      reasoningEffort?: 'low' | 'high';
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<ChatCompletionResponse> {
    const {
      systemPrompt,
      reasoningEffort = 'high',
    } = options;

    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    // Using Responses API for reasoning as per docs
    const response = await this.request<ResponsesApiResponse>('/responses', {
      method: 'POST',
      body: JSON.stringify({
        model: 'grok-3-mini',
        input: messages,
        reasoning: { effort: reasoningEffort },
        stream: false,
      }),
    });

    // Extract the message content
    const messageOutput = response.output.find(item => item.type === 'message');
    const textContent = messageOutput?.content?.find(c => c.type === 'output_text');

    return {
      id: response.id,
      object: 'chat.completion',
      created: response.created_at,
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: textContent?.text || '',
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        reasoning_tokens: response.usage.output_tokens_details?.reasoning_tokens,
      },
    };
  }

  // ==========================================================================
  // Web Search
  // ==========================================================================

  async webSearch(
    query: string,
    options: {
      systemPrompt?: string;
      allowedDomains?: string[];
      excludedDomains?: string[];
      enableImageUnderstanding?: boolean;
    } = {}
  ): Promise<ResponsesApiResponse> {
    const {
      systemPrompt,
      allowedDomains,
      excludedDomains,
      enableImageUnderstanding,
    } = options;

    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: query });

    const webSearchTool: WebSearchTool = {
      type: 'web_search',
    };

    if (allowedDomains?.length || excludedDomains?.length) {
      webSearchTool.filters = {};
      if (allowedDomains?.length) {
        webSearchTool.filters.allowed_domains = allowedDomains.slice(0, 5);
      }
      if (excludedDomains?.length) {
        webSearchTool.filters.excluded_domains = excludedDomains.slice(0, 5);
      }
    }

    if (enableImageUnderstanding) {
      webSearchTool.enable_image_understanding = true;
    }

    return this.request<ResponsesApiResponse>('/responses', {
      method: 'POST',
      body: JSON.stringify({
        model: 'grok-4-1-fast',
        input: messages,
        tools: [webSearchTool],
        store: false,
      }),
    });
  }

  // ==========================================================================
  // X (Twitter) Search
  // ==========================================================================

  async xSearch(
    query: string,
    options: {
      systemPrompt?: string;
      allowedHandles?: string[];
      excludedHandles?: string[];
      fromDate?: string;
      toDate?: string;
      enableImageUnderstanding?: boolean;
      enableVideoUnderstanding?: boolean;
    } = {}
  ): Promise<ResponsesApiResponse> {
    const {
      systemPrompt,
      allowedHandles,
      excludedHandles,
      fromDate,
      toDate,
      enableImageUnderstanding,
      enableVideoUnderstanding,
    } = options;

    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: query });

    const xSearchTool: XSearchTool = {
      type: 'x_search',
    };

    if (allowedHandles?.length) {
      xSearchTool.allowed_x_handles = allowedHandles.slice(0, 10);
    }
    if (excludedHandles?.length) {
      xSearchTool.excluded_x_handles = excludedHandles.slice(0, 10);
    }
    if (fromDate) {
      xSearchTool.from_date = fromDate;
    }
    if (toDate) {
      xSearchTool.to_date = toDate;
    }
    if (enableImageUnderstanding) {
      xSearchTool.enable_image_understanding = true;
    }
    if (enableVideoUnderstanding) {
      xSearchTool.enable_video_understanding = true;
    }

    return this.request<ResponsesApiResponse>('/responses', {
      method: 'POST',
      body: JSON.stringify({
        model: 'grok-4-1-fast',
        input: messages,
        tools: [xSearchTool],
        store: false,
      }),
    });
  }

  // ==========================================================================
  // Code Execution
  // ==========================================================================

  async executeCode(
    prompt: string,
    options: {
      systemPrompt?: string;
    } = {}
  ): Promise<ResponsesApiResponse> {
    const { systemPrompt } = options;

    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return this.request<ResponsesApiResponse>('/responses', {
      method: 'POST',
      body: JSON.stringify({
        model: 'grok-4-1-fast',
        input: messages,
        tools: [{ type: 'code_interpreter' }],
        store: false,
      }),
    });
  }

  // ==========================================================================
  // Image Generation
  // ==========================================================================

  async generateImage(
    prompt: string,
    options: {
      n?: number;
      responseFormat?: 'url' | 'b64_json';
    } = {}
  ): Promise<ImageGenerationResponse> {
    const { n = 1, responseFormat = 'url' } = options;

    return this.request<ImageGenerationResponse>('/images/generations', {
      method: 'POST',
      body: JSON.stringify({
        model: 'grok-2-image-1212',
        prompt,
        n: Math.min(Math.max(n, 1), 10),
        response_format: responseFormat,
      }),
    });
  }
}

// ============================================================================
// Export singleton instance and types
// ============================================================================

export const grokApi = new GrokApiClient();
export default grokApi;

// Also export the class for custom instances
export { GrokApiClient };
