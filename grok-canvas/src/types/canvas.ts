// Position and size types
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Base interface for all node types
export interface BaseNode {
  id: string;
  position: Position;
  size: Size;
}

// ============ INPUT BLOCKS ============

export interface TextInputBlock extends BaseNode {
  type: 'textInput';
  label: string;
  value: string;
  placeholder: string;
}

export interface ImageInputBlock extends BaseNode {
  type: 'imageInput';
  label: string;
  imageUrl: string;
  detail: 'auto' | 'low' | 'high';
}

// ============ MODEL BLOCKS ============

export interface TextCompletionBlock extends BaseNode {
  type: 'textCompletion';
  model: 'grok-4' | 'grok-4-fast' | 'grok-3-mini';
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface VisionBlock extends BaseNode {
  type: 'vision';
  model: 'grok-4' | 'grok-4-fast';
  prompt: string;
  detail: 'auto' | 'low' | 'high';
}

export interface ReasoningBlock extends BaseNode {
  type: 'reasoning';
  model: 'grok-3-mini';
  reasoningEffort: 'low' | 'high';
  systemPrompt: string;
}

// ============ TOOL BLOCKS ============

export interface WebSearchBlock extends BaseNode {
  type: 'webSearch';
  model: 'grok-4-1-fast';
  allowedDomains: string[];
  excludedDomains: string[];
  enableImageUnderstanding: boolean;
}

export interface XSearchBlock extends BaseNode {
  type: 'xSearch';
  model: 'grok-4-1-fast';
  query: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

export interface CodeExecutionBlock extends BaseNode {
  type: 'codeExecution';
  model: 'grok-4-1-fast';
  description: string;
}

// ============ OUTPUT BLOCKS ============

export interface OutputBlock extends BaseNode {
  type: 'output';
  label: string;
  outputValue: string;
}

// Union type for all blocks
export type GrokBlock =
  | TextInputBlock
  | ImageInputBlock
  | TextCompletionBlock
  | VisionBlock
  | ReasoningBlock
  | WebSearchBlock
  | XSearchBlock
  | CodeExecutionBlock
  | OutputBlock;

// Tool types for toolbar
export type ToolType =
  | 'select'
  | 'textInput'
  | 'imageInput'
  | 'textCompletion'
  | 'vision'
  | 'reasoning'
  | 'webSearch'
  | 'xSearch'
  | 'postToX'
  | 'codeExecution'
  | 'output';

// Connection between nodes
export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Canvas state
export interface CanvasState {
  blocks: GrokBlock[];
  connections: Connection[];
  selectedTool: ToolType;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Block category for toolbar grouping
export interface BlockCategory {
  name: string;
  blocks: {
    type: ToolType;
    label: string;
    icon: string;
    color: string;
  }[];
}

// ============ EXECUTION TYPES ============

// Node execution status
export type NodeExecutionStatus = 'idle' | 'validating' | 'running' | 'success' | 'error';

// Execution state for a node
export interface NodeExecutionState {
  status: NodeExecutionStatus;
  output?: unknown;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

// ============ X NODE OUTPUT TYPES ============

// Tweet structure from X API
export interface Tweet {
  id: string;
  text: string;
  author: string;
  authorUsername: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
}

// X Node output structure
export interface XNodeOutput {
  success: boolean;
  query: string;
  threshold?: number;
  timeWindow?: string;
  count: number;
  tweets: Tweet[];
  metadata: {
    searchedAt: string;
    apiResponseTime: number;
  };
  error?: string;
}

// ============ VALIDATION TYPES ============

// Grok validation result for X queries
export interface XQueryValidationResult {
  valid: boolean;
  reason?: string;
  parsed?: {
    searchQuery: string;
    threshold?: number;
    timeWindow?: string;
  };
}
