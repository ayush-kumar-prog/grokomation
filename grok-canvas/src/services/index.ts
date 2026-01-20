/**
 * Services Index
 *
 * Export all services for easy importing throughout the application.
 *
 * Usage:
 *   import { llmRouter, grokApi, workflowExecutor } from './services';
 *   // or
 *   import { llmRouter } from './services/llmRouter';
 */

// LLM Router - High-level unified interface
export { llmRouter, LLMRouter } from './llmRouter';

// Workflow Executor - Node connection traversal and execution
export {
  findWorkflowPath,
  getWorkflowType,
  executeWorkflow,
} from './workflowExecutor';
export type { WorkflowResult, WorkflowPath } from './workflowExecutor';
export type {
  CapabilityType,
  ChatRequest,
  VisionRequest,
  ReasoningRequest,
  WebSearchRequest,
  XSearchRequest,
  CodeExecutionRequest,
  ImageGenerationRequest,
  RouterRequest,
  RouterResponse,
  ExtractedChatContent,
  ExtractedSearchContent,
  ExtractedImageContent,
  ChatMessage,
  StreamChunk,
} from './llmRouter';

// Grok API Client - Low-level direct API access
export { grokApi, GrokApiClient } from './grokApi';
export type {
  TextModel,
  VisionModel,
  ReasoningModel,
  SearchModel,
  ImageModel,
  ContentPart,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ResponsesApiResponse,
  ImageGenerationResponse,
  WebSearchTool,
  XSearchTool,
  CodeInterpreterTool,
  ResponseTool,
} from './grokApi';
