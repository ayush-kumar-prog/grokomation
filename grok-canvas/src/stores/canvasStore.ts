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
  XFetchBlock,
  NodeExecutionState,
  NodeExecutionStatus,
} from '../types/canvas';

const generateId = () => nanoid(10);

// Default sizes for different block types
const blockSizes: Record<string, { width: number; height: number }> = {
  textInput: { width: 320, height: 220 },
  imageInput: { width: 80, height: 80 },
  textCompletion: { width: 390, height: 840 },
  phone: { width: 304, height: 580 },
  // X Fetch node - full size
  xFetch: { width: 380, height: 520 },
  // Icon nodes - small size
  reasoning: { width: 80, height: 80 },
  webSearch: { width: 80, height: 80 },
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

  // ============ EXECUTION STATE ============
  nodeExecutionStates: Record<string, NodeExecutionState>;
  nodeOutputs: Record<string, unknown>;

  // Execution actions
  setNodeExecutionStatus: (nodeId: string, status: NodeExecutionStatus, error?: string) => void;
  setNodeOutput: (nodeId: string, output: unknown) => void;
  getNodeOutput: (nodeId: string) => unknown;
  clearExecutionStates: () => void;
  getInputFromConnections: (nodeId: string) => unknown | undefined;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  blocks: [],
  connections: [],
  selectedTool: 'select',
  viewport: { x: 0, y: 0, zoom: 1 },

  // Execution state
  nodeExecutionStates: {},
  nodeOutputs: {},

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
          fetchType: 'search',
          count: 10,
          includeReplies: false,
          query: '',
        } as XFetchBlock;
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
      nodeExecutionStates: {},
      nodeOutputs: {},
    }),

  // ============ EXECUTION ACTIONS ============

  setNodeExecutionStatus: (nodeId, status, error) => {
    set((state) => ({
      nodeExecutionStates: {
        ...state.nodeExecutionStates,
        [nodeId]: {
          ...state.nodeExecutionStates[nodeId],
          status,
          error,
          ...(status === 'running' ? { startedAt: Date.now() } : {}),
          ...(status === 'success' || status === 'error' ? { completedAt: Date.now() } : {}),
        },
      },
    }));
  },

  setNodeOutput: (nodeId, output) => {
    set((state) => ({
      nodeOutputs: {
        ...state.nodeOutputs,
        [nodeId]: output,
      },
      nodeExecutionStates: {
        ...state.nodeExecutionStates,
        [nodeId]: {
          ...state.nodeExecutionStates[nodeId],
          status: 'success' as NodeExecutionStatus,
          output,
          completedAt: Date.now(),
        },
      },
    }));
  },

  getNodeOutput: (nodeId) => {
    return get().nodeOutputs[nodeId];
  },

  clearExecutionStates: () => {
    set({
      nodeExecutionStates: {},
      nodeOutputs: {},
    });
  },

  getInputFromConnections: (nodeId) => {
    const state = get();
    // Find connections where this node is the target
    const incomingConnections = state.connections.filter((c) => c.target === nodeId);

    if (incomingConnections.length === 0) {
      return undefined;
    }

    // Get the output from the first connected source node
    const sourceNodeId = incomingConnections[0].source;

    // First check nodeOutputs (for executed nodes like X Search)
    if (state.nodeOutputs[sourceNodeId] !== undefined) {
      return state.nodeOutputs[sourceNodeId];
    }

    // Then check block data (for input nodes like TextInput)
    const sourceBlock = state.blocks.find((b) => b.id === sourceNodeId);
    if (sourceBlock) {
      // TextInput stores value in block data
      if (sourceBlock.type === 'textInput' && 'value' in sourceBlock) {
        return (sourceBlock as TextInputBlock).value;
      }
    }

    return undefined;
  },
}));
