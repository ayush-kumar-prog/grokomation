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

// Icon-only capability block
export interface VisionBlock extends BaseNode {
  type: 'vision';
}

// Icon-only reasoning block
export interface ReasoningBlock extends BaseNode {
  type: 'reasoning';
}

// ============ TOOL BLOCKS ============

// Icon-only web search block
export interface WebSearchBlock extends BaseNode {
  type: 'webSearch';
}

// X fetch block with full properties
export interface XFetchBlock extends BaseNode {
  type: 'xFetch';
  fetchType: 'search' | 'user_timeline' | 'mentions' | 'trending';
  count: number;
  includeReplies: boolean;
  query?: string;
}

// Node execution status
export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'error';

// Execution state for a node
export interface NodeExecutionState {
  status: NodeExecutionStatus;
  output?: unknown;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

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
  count: number;
  tweets: Tweet[];
  metadata: {
    searchedAt: string;
    apiResponseTime: number;
  };
  error?: string;
}

// Icon-only capability block
export interface CodeExecutionBlock extends BaseNode {
  type: 'codeExecution';
}

// ============ OUTPUT BLOCKS ============

// Icon-only output block
export interface OutputBlock extends BaseNode {
  type: 'output';
}

// ============ PHONE BLOCK ============

export type PhoneContentType = 'default' | 'code' | 'image' | 'webSearch' | 'reasoning' | 'xFetch' | 'xDM';

export interface PhoneBlock extends BaseNode {
  type: 'phone';
  title: string;
  isLoading: boolean;
  showQR: boolean;
  inspectorMode: boolean;
  currentVersion: number;
  totalVersions: number;
  scrollPosition: number;
  // Dynamic content from workflow execution
  contentType: PhoneContentType;
  content: string; // React code string or image URL
  error?: string; // Error message if execution failed
}

// Union type for all blocks
export type GrokBlock =
  | TextInputBlock
  | ImageInputBlock
  | TextCompletionBlock
  | VisionBlock
  | ReasoningBlock
  | WebSearchBlock
  | XFetchBlock
  | CodeExecutionBlock
  | OutputBlock
  | PhoneBlock;

// Tool types for toolbar
export type ToolType =
  | 'select'
  | 'textInput'
  | 'imageInput'
  | 'textCompletion'
  | 'vision'
  | 'reasoning'
  | 'webSearch'
  | 'xFetch'
  | 'codeExecution'
  | 'output'
  | 'phone';

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
