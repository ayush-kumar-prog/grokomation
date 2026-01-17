import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  CanvasState,
  ToolType,
  Position,
  GrokBlock,
  Connection,
  TextInputBlock,
  TextCompletionBlock,
  PhoneBlock,
} from '../types/canvas';

const generateId = () => nanoid(10);

// Default sizes for different block types
const blockSizes: Record<string, { width: number; height: number }> = {
  textInput: { width: 320, height: 220 },
  imageInput: { width: 80, height: 80 },
  textCompletion: { width: 390, height: 840 },
  phone: { width: 304, height: 580 },
  // Icon nodes - small size
  reasoning: { width: 80, height: 80 },
  webSearch: { width: 80, height: 80 },
  xFetch: { width: 80, height: 80 },
  vision: { width: 80, height: 80 },
  codeExecution: { width: 80, height: 80 },
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
        } as GrokBlock;
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
        } as GrokBlock;
        break;

      case 'reasoning':
        newBlock = {
          ...baseBlock,
          type: 'reasoning',
        } as GrokBlock;
        break;

      case 'webSearch':
        newBlock = {
          ...baseBlock,
          type: 'webSearch',
        } as GrokBlock;
        break;

      case 'xFetch':
        newBlock = {
          ...baseBlock,
          type: 'xFetch',
        } as GrokBlock;
        break;

      case 'codeExecution':
        newBlock = {
          ...baseBlock,
          type: 'codeExecution',
        } as GrokBlock;
        break;

      case 'output':
        newBlock = {
          ...baseBlock,
          type: 'output',
        } as GrokBlock;
        break;

      case 'phone':
        newBlock = {
          ...baseBlock,
          type: 'phone',
          title: 'My App',
          isLoading: false,
          showQR: false,
          inspectorMode: false,
          currentVersion: 1,
          totalVersions: 1,
          scrollPosition: 0,
          contentType: 'default',
          content: '',
        } as PhoneBlock;
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
