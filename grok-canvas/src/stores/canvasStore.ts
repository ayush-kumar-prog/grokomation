import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  CanvasState,
  ToolType,
  Position,
  GrokBlock,
  Connection,
  TextInputBlock,
  ImageInputBlock,
  TextCompletionBlock,
  VisionBlock,
  ReasoningBlock,
  WebSearchBlock,
  XSearchBlock,
  CodeExecutionBlock,
  OutputBlock,
} from '../types/canvas';

const generateId = () => nanoid(10);

// Default sizes for different block types
const blockSizes: Record<string, { width: number; height: number }> = {
  textInput: { width: 320, height: 220 },
  imageInput: { width: 320, height: 280 },
  textCompletion: { width: 340, height: 340 },
  vision: { width: 340, height: 320 },
  reasoning: { width: 340, height: 340 },
  webSearch: { width: 340, height: 380 },
  xSearch: { width: 380, height: 420 },
  codeExecution: { width: 340, height: 280 },
  output: { width: 340, height: 280 },
};

interface CanvasStore extends CanvasState {
  // Tool selection
  setSelectedTool: (tool: ToolType) => void;

  // Block actions
  addBlock: (type: ToolType, position: Position) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateBlock: (id: string, updates: Record<string, any>) => void;
  updateBlockPosition: (id: string, position: Position) => void;
  removeBlock: (id: string) => void;

  // Connection actions
  addConnection: (connection: Omit<Connection, 'id'>) => void;
  removeConnection: (id: string) => void;
  removeConnectionByEdgeId: (edgeId: string) => void;

  // Viewport
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // Bulk operations
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  blocks: [],
  connections: [],
  selectedTool: 'select',
  viewport: { x: 0, y: 0, zoom: 1 },

  setSelectedTool: (tool) => set({ selectedTool: tool }),

  addBlock: (type, position) => {
    if (type === 'select') return;

    const size = blockSizes[type] || { width: 300, height: 200 };
    const baseBlock = {
      id: generateId(),
      position,
      size,
    };

    let newBlock: GrokBlock;

    switch (type) {
      case 'textInput':
        newBlock = {
          ...baseBlock,
          type: 'textInput',
          label: 'Text Input',
          value: '',
          placeholder: 'Enter your prompt...',
        } as TextInputBlock;
        break;

      case 'imageInput':
        newBlock = {
          ...baseBlock,
          type: 'imageInput',
          label: 'Image Input',
          imageUrl: '',
          detail: 'auto',
        } as ImageInputBlock;
        break;

      case 'textCompletion':
        newBlock = {
          ...baseBlock,
          type: 'textCompletion',
          model: 'grok-4',
          systemPrompt: 'You are Grok, a helpful AI assistant.',
          temperature: 0.7,
          maxTokens: 1024,
        } as TextCompletionBlock;
        break;

      case 'vision':
        newBlock = {
          ...baseBlock,
          type: 'vision',
          model: 'grok-4',
          prompt: 'Describe this image',
          detail: 'auto',
        } as VisionBlock;
        break;

      case 'reasoning':
        newBlock = {
          ...baseBlock,
          type: 'reasoning',
          model: 'grok-3-mini',
          reasoningEffort: 'high',
          systemPrompt: 'You are a highly intelligent AI assistant.',
        } as ReasoningBlock;
        break;

      case 'webSearch':
        newBlock = {
          ...baseBlock,
          type: 'webSearch',
          model: 'grok-4-1-fast',
          allowedDomains: [],
          excludedDomains: [],
          enableImageUnderstanding: false,
        } as WebSearchBlock;
        break;

      case 'xSearch':
        newBlock = {
          ...baseBlock,
          type: 'xSearch',
          model: 'grok-4-1-fast',
          query: '',
          messages: [],
        } as XSearchBlock;
        break;

      case 'codeExecution':
        newBlock = {
          ...baseBlock,
          type: 'codeExecution',
          model: 'grok-4-1-fast',
          description: 'Execute Python code',
        } as CodeExecutionBlock;
        break;

      case 'output':
        newBlock = {
          ...baseBlock,
          type: 'output',
          label: 'Output',
          outputValue: '',
        } as OutputBlock;
        break;

      default:
        return;
    }

    set((state) => ({
      blocks: [...state.blocks, newBlock],
    }));
  },

  updateBlock: (id, updates) => {
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ),
    }));
  },

  updateBlockPosition: (id, position) => {
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id ? { ...block, position } : block
      ),
    }));
  },

  removeBlock: (id) => {
    set((state) => ({
      blocks: state.blocks.filter((block) => block.id !== id),
      connections: state.connections.filter(
        (conn) => conn.source !== id && conn.target !== id
      ),
    }));
  },

  addConnection: (connection) => {
    const id = `conn-${connection.source}-${connection.target}-${generateId()}`;
    set((state) => ({
      connections: [...state.connections, { ...connection, id }],
    }));
  },

  removeConnection: (id) => {
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
    }));
  },

  removeConnectionByEdgeId: (edgeId) => {
    set((state) => ({
      connections: state.connections.filter((conn) => {
        const expectedEdgeId = `edge-${conn.source}-${conn.sourceHandle}-${conn.target}-${conn.targetHandle}`;
        return expectedEdgeId !== edgeId;
      }),
    }));
  },

  setViewport: (viewport) => set({ viewport }),

  clearCanvas: () =>
    set({
      blocks: [],
      connections: [],
      selectedTool: 'select',
    }),
}));
