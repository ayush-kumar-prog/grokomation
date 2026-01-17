# Canvas Implementation Guide

This document explains how to create an infinite canvas with a bottom toolbar and drag-and-drop block functionality, similar to October's canvas implementation. Use this guide for projects that need a visual node-based canvas interface.

## Overview

The canvas system consists of:
1. **React Flow** - Powers the infinite canvas with pan/zoom and node rendering
2. **Zustand Store** - Manages all canvas state (nodes, connections, selected tool)
3. **Toolbar Component** - Bottom-center toolbar for selecting block types
4. **Custom Node Components** - React components that render as draggable blocks on canvas
5. **Click-to-Place System** - Select tool → click canvas → block appears at click position

---

## Prerequisites

```bash
npm install @xyflow/react zustand lucide-react
```

**Package versions used:**
- `@xyflow/react`: ^12.x (React Flow v12)
- `zustand`: ^5.x
- `lucide-react`: ^0.x (for toolbar icons)

---

## File Structure

```
src/
├── components/
│   ├── Canvas.tsx           # Main React Flow canvas
│   ├── CanvasContainer.tsx  # Wrapper with toolbar
│   ├── Toolbar.tsx          # Bottom toolbar component
│   └── nodes/               # Custom node components
│       ├── index.ts         # Node types registry
│       └── ExampleNode.tsx  # Example custom node
├── stores/
│   └── canvasStore.ts       # Zustand state management
├── types/
│   └── canvas.ts            # TypeScript type definitions
└── App.tsx                  # Route setup
```

---

## Step 1: Type Definitions

Create `/src/types/canvas.ts`:

```typescript
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
  isSelected: boolean;
}

// Example node type - create similar interfaces for each block type
export interface ExampleBlock extends BaseNode {
  title: string;
  content: string;
  // Add type-specific properties here
}

// Connection between nodes
export interface Connection {
  id: string;
  source: string;       // Source node ID
  target: string;       // Target node ID
  sourceHandle?: string; // Optional: specific handle on source
  targetHandle?: string; // Optional: specific handle on target
}

// Tool types - add your block types here
export type ToolType =
  | 'select'      // Default selection mode
  | 'example'     // Example block type
  | 'another';    // Another block type
  // Add more tool types as needed

// Complete canvas state
export interface CanvasState {
  // Node arrays - add one for each block type
  exampleBlocks: ExampleBlock[];
  // anotherBlocks: AnotherBlock[];

  // Connections between nodes
  connections: Connection[];

  // Currently selected tool
  selectedTool: ToolType;

  // Canvas viewport state (optional, for persistence)
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}
```

---

## Step 2: Zustand Store

Create `/src/stores/canvasStore.ts`:

```typescript
import { create } from 'zustand';
import { nanoid } from 'nanoid'; // or use crypto.randomUUID()
import type {
  CanvasState,
  ToolType,
  Position,
  ExampleBlock,
  Connection
} from '../types/canvas';

// Generate unique IDs
const generateId = () => nanoid(10);

// Store interface with actions
interface CanvasStore extends CanvasState {
  // Tool selection
  setSelectedTool: (tool: ToolType) => void;

  // Example block actions - create similar for each block type
  addExampleBlock: (position: Position) => void;
  updateExampleBlock: (id: string, updates: Partial<ExampleBlock>) => void;
  updateExampleBlockPosition: (id: string, position: Position) => void;
  removeExampleBlock: (id: string) => void;

  // Connection actions
  addConnection: (connection: Omit<Connection, 'id'>) => void;
  removeConnection: (id: string) => void;
  removeConnectionByEdgeId: (edgeId: string) => void;

  // Viewport actions
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // Bulk operations
  clearCanvas: () => void;
  loadState: (state: Partial<CanvasState>) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  exampleBlocks: [],
  connections: [],
  selectedTool: 'select',
  viewport: { x: 0, y: 0, zoom: 1 },

  // Tool selection
  setSelectedTool: (tool) => set({ selectedTool: tool }),

  // Add example block at position
  addExampleBlock: (position) => {
    const newBlock: ExampleBlock = {
      id: generateId(),
      position,
      size: { width: 300, height: 200 }, // Default size
      isSelected: false,
      title: 'New Block',
      content: '',
    };

    set((state) => ({
      exampleBlocks: [...state.exampleBlocks, newBlock],
    }));
  },

  // Update example block properties
  updateExampleBlock: (id, updates) => {
    set((state) => ({
      exampleBlocks: state.exampleBlocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ),
    }));
  },

  // Update position only (called on drag end)
  updateExampleBlockPosition: (id, position) => {
    set((state) => ({
      exampleBlocks: state.exampleBlocks.map((block) =>
        block.id === id ? { ...block, position } : block
      ),
    }));
  },

  // Remove example block
  removeExampleBlock: (id) => {
    set((state) => ({
      exampleBlocks: state.exampleBlocks.filter((block) => block.id !== id),
      // Also remove any connections to/from this block
      connections: state.connections.filter(
        (conn) => conn.source !== id && conn.target !== id
      ),
    }));
  },

  // Add connection
  addConnection: (connection) => {
    const id = `conn-${connection.source}-${connection.target}-${generateId()}`;
    set((state) => ({
      connections: [...state.connections, { ...connection, id }],
    }));
  },

  // Remove connection by ID
  removeConnection: (id) => {
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
    }));
  },

  // Remove connection by React Flow edge ID
  removeConnectionByEdgeId: (edgeId) => {
    set((state) => ({
      connections: state.connections.filter((conn) => {
        const expectedEdgeId = `edge-${conn.source}-${conn.sourceHandle}-${conn.target}-${conn.targetHandle}`;
        return expectedEdgeId !== edgeId;
      }),
    }));
  },

  // Set viewport
  setViewport: (viewport) => set({ viewport }),

  // Clear all canvas content
  clearCanvas: () => set({
    exampleBlocks: [],
    connections: [],
    selectedTool: 'select',
  }),

  // Load saved state
  loadState: (state) => set((current) => ({ ...current, ...state })),
}));
```

---

## Step 3: Custom Node Components

Create `/src/components/nodes/ExampleNode.tsx`:

```tsx
import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '../../stores/canvasStore';
import type { ExampleBlock } from '../../types/canvas';

// Node data interface matches your block type
interface ExampleNodeData extends ExampleBlock {}

const ExampleNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as ExampleNodeData;
  const updateExampleBlock = useCanvasStore((s) => s.updateExampleBlock);

  return (
    <div
      className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden"
      style={{
        width: nodeData.size.width,
        height: nodeData.size.height
      }}
    >
      {/* Input handle (left side) - for receiving connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />

      {/* Node content */}
      <div className="p-4 h-full flex flex-col">
        {/* Header with title */}
        <div className="flex items-center justify-between mb-2">
          <input
            type="text"
            value={nodeData.title}
            onChange={(e) => updateExampleBlock(id, { title: e.target.value })}
            className="font-semibold text-lg bg-transparent border-none outline-none"
            placeholder="Block Title"
          />
        </div>

        {/* Main content area */}
        <textarea
          value={nodeData.content}
          onChange={(e) => updateExampleBlock(id, { content: e.target.value })}
          className="flex-1 resize-none bg-gray-50 rounded p-2 text-sm"
          placeholder="Enter content..."
        />
      </div>

      {/* Output handle (right side) - for creating connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
};

// Memoize with custom equality to prevent unnecessary re-renders
export default memo(ExampleNode, (prevProps, nextProps) => {
  // Compare only data that affects rendering
  const prevData = prevProps.data as ExampleNodeData;
  const nextData = nextProps.data as ExampleNodeData;

  return (
    prevData.title === nextData.title &&
    prevData.content === nextData.content &&
    prevData.size.width === nextData.size.width &&
    prevData.size.height === nextData.size.height
  );
});
```

Create `/src/components/nodes/index.ts`:

```typescript
import ExampleNode from './ExampleNode';
// Import other node components here

// Node types registry - React Flow uses this to render correct component
export const nodeTypes = {
  example: ExampleNode,
  // Add more node types here:
  // another: AnotherNode,
};
```

---

## Step 4: Toolbar Component

Create `/src/components/Toolbar.tsx`:

```tsx
import React from 'react';
import {
  MousePointer,
  Square,
  // Import icons for your block types from lucide-react
} from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';
import type { ToolType } from '../types/canvas';

// Define your tools here
const tools: Array<{
  id: ToolType;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}> = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'example', icon: Square, label: 'Add Example Block' },
  // Add more tools here:
  // { id: 'another', icon: Circle, label: 'Add Another Block' },
];

const Toolbar: React.FC = () => {
  const selectedTool = useCanvasStore((s) => s.selectedTool);
  const setSelectedTool = useCanvasStore((s) => s.setSelectedTool);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-1 bg-gray-900/95 backdrop-blur-sm rounded-xl p-2 shadow-2xl border border-gray-700">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`
                relative p-3 rounded-lg transition-all duration-200
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
              `}
              title={tool.label}
            >
              <Icon size={20} />

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tool label tooltip */}
      {selectedTool !== 'select' && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Click on canvas to place
        </div>
      )}
    </div>
  );
};

export default Toolbar;
```

---

## Step 5: Main Canvas Component

Create `/src/components/Canvas.tsx`:

```tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type Connection as FlowConnection,
  type NodeChange,
  type EdgeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '../stores/canvasStore';
import { nodeTypes } from './nodes';

const Canvas: React.FC = () => {
  const { screenToFlowPosition } = useReactFlow();

  // Get state from store
  const exampleBlocks = useCanvasStore((s) => s.exampleBlocks);
  const connections = useCanvasStore((s) => s.connections);
  const selectedTool = useCanvasStore((s) => s.selectedTool);

  // Get actions from store
  const setSelectedTool = useCanvasStore((s) => s.setSelectedTool);
  const addExampleBlock = useCanvasStore((s) => s.addExampleBlock);
  const updateExampleBlockPosition = useCanvasStore((s) => s.updateExampleBlockPosition);
  const removeExampleBlock = useCanvasStore((s) => s.removeExampleBlock);
  const addConnection = useCanvasStore((s) => s.addConnection);
  const removeConnectionByEdgeId = useCanvasStore((s) => s.removeConnectionByEdgeId);

  // Track cursor position for tool indicator
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Track cursor for tool indicator
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    if (selectedTool !== 'select') {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [selectedTool]);

  // Convert store state to React Flow nodes
  const nodes: Node[] = useMemo(() => {
    const allNodes: Node[] = [];

    // Add example blocks as nodes
    exampleBlocks.forEach((block) => {
      allNodes.push({
        id: block.id,
        type: 'example',
        position: block.position,
        data: block, // Pass entire block data to node component
        selected: block.isSelected,
      });
    });

    // Add other block types here...

    return allNodes;
  }, [exampleBlocks]);

  // Convert store connections to React Flow edges
  const edges: Edge[] = useMemo(() => {
    return connections.map((conn) => ({
      id: `edge-${conn.source}-${conn.sourceHandle}-${conn.target}-${conn.targetHandle}`,
      source: conn.source,
      target: conn.target,
      sourceHandle: conn.sourceHandle,
      targetHandle: conn.targetHandle,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3b82f6',
      },
    }));
  }, [connections]);

  // Local edges state for React Flow
  const [localEdges, setLocalEdges] = useState<Edge[]>(edges);

  // Sync local edges with store
  useEffect(() => {
    setLocalEdges(edges);
  }, [edges]);

  // Handle canvas pane click - place blocks
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Only place blocks if a tool is selected
      if (selectedTool === 'select') return;

      // Convert screen coordinates to canvas coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create block based on selected tool
      switch (selectedTool) {
        case 'example':
          addExampleBlock(position);
          break;
        // Add cases for other block types:
        // case 'another':
        //   addAnotherBlock(position);
        //   break;
      }

      // Reset to select tool after placing
      setSelectedTool('select');
    },
    [selectedTool, screenToFlowPosition, addExampleBlock, setSelectedTool]
  );

  // Handle node position changes after drag
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const { type, id, position } = node;

      // Update position in store based on node type
      switch (type) {
        case 'example':
          updateExampleBlockPosition(id, position);
          break;
        // Add cases for other block types
      }
    },
    [updateExampleBlockPosition]
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      deletedNodes.forEach((node) => {
        switch (node.type) {
          case 'example':
            removeExampleBlock(node.id);
            break;
          // Add cases for other block types
        }
      });
    },
    [removeExampleBlock]
  );

  // Handle new connections
  const onConnect = useCallback(
    (params: FlowConnection) => {
      if (!params.source || !params.target) return;

      // Create edge for React Flow
      const newEdge: Edge = {
        id: `edge-${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle ?? undefined,
        targetHandle: params.targetHandle ?? undefined,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
      };

      setLocalEdges((eds) => addEdge(newEdge, eds));

      // Add to store
      addConnection({
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle ?? undefined,
        targetHandle: params.targetHandle ?? undefined,
      });
    },
    [addConnection]
  );

  // Handle edge deletion (double-click)
  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setLocalEdges((eds) => eds.filter((e) => e.id !== edge.id));
      removeConnectionByEdgeId(edge.id);
    },
    [removeConnectionByEdgeId]
  );

  // Handle node changes (selection, position during drag)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // React Flow handles the visual updates internally
      // We only persist on drag stop (onNodeDragStop)
    },
    []
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setLocalEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={localEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift']}
        panOnDrag={selectedTool === 'select'}
        selectionOnDrag={false}
        className="bg-gray-950"
      >
        {/* Grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151"
        />

        {/* Zoom controls */}
        <Controls
          className="bg-gray-800 border-gray-700 rounded-lg"
          showInteractive={false}
        />

        {/* Mini map */}
        <MiniMap
          className="bg-gray-800 border-gray-700 rounded-lg"
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>

      {/* Tool cursor indicator */}
      {selectedTool !== 'select' && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: cursorPosition.x + 15,
            top: cursorPosition.y + 15,
          }}
        >
          <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 shadow-xl">
            <span className="text-xs text-gray-300">
              Click to place {selectedTool} block
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
```

---

## Step 6: Canvas Container

Create `/src/components/CanvasContainer.tsx`:

```tsx
import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Canvas from './Canvas';
import Toolbar from './Toolbar';

const CanvasContainer: React.FC = () => {
  return (
    <div className="w-full h-screen bg-gray-950 overflow-hidden">
      {/* React Flow requires a provider for hooks like useReactFlow */}
      <ReactFlowProvider>
        <Canvas />
        <Toolbar />
      </ReactFlowProvider>
    </div>
  );
};

export default CanvasContainer;
```

---

## Step 7: Route Setup

In your `App.tsx` or router configuration:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CanvasContainer from './components/CanvasContainer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Your other routes */}
        <Route path="/canvas" element={<CanvasContainer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Adding New Block Types

To add a new block type, follow these steps:

### 1. Define the type in `/src/types/canvas.ts`:

```typescript
export interface MyNewBlock extends BaseNode {
  title: string;
  // Add type-specific properties
  myProperty: string;
}

// Add to ToolType
export type ToolType = 'select' | 'example' | 'myNew';
```

### 2. Add to store in `/src/stores/canvasStore.ts`:

```typescript
// Add to state
myNewBlocks: MyNewBlock[];

// Add actions
addMyNewBlock: (position: Position) => void;
updateMyNewBlock: (id: string, updates: Partial<MyNewBlock>) => void;
updateMyNewBlockPosition: (id: string, position: Position) => void;
removeMyNewBlock: (id: string) => void;

// Implement the actions (follow existing pattern)
```

### 3. Create node component `/src/components/nodes/MyNewNode.tsx`:

```tsx
// Follow ExampleNode.tsx pattern
```

### 4. Register in `/src/components/nodes/index.ts`:

```typescript
import MyNewNode from './MyNewNode';

export const nodeTypes = {
  example: ExampleNode,
  myNew: MyNewNode,
};
```

### 5. Add to Toolbar in `/src/components/Toolbar.tsx`:

```typescript
const tools = [
  // ... existing tools
  { id: 'myNew', icon: MyIcon, label: 'Add My New Block' },
];
```

### 6. Add to Canvas click handler in `/src/components/Canvas.tsx`:

```typescript
// In onPaneClick
case 'myNew':
  addMyNewBlock(position);
  break;

// In onNodeDragStop
case 'myNew':
  updateMyNewBlockPosition(id, position);
  break;

// In onNodesDelete
case 'myNew':
  removeMyNewBlock(node.id);
  break;

// In nodes memo
myNewBlocks.forEach((block) => {
  allNodes.push({
    id: block.id,
    type: 'myNew',
    position: block.position,
    data: block,
  });
});
```

---

## Key Implementation Details

### Coordinate Conversion
React Flow uses its own coordinate system. Always use `screenToFlowPosition()` to convert mouse click coordinates to canvas coordinates.

### Node Data Flow
1. Store holds the source of truth for node data
2. `nodes` memo converts store state → React Flow format
3. Node components receive data via `props.data`
4. Updates go through store actions, not direct React Flow mutations

### Drag Handling
- `onNodeDragStop` captures final position after drag
- Update store only on drag end, not during drag (performance)
- React Flow handles visual updates during drag automatically

### Connection System
- Handles define connection points (source/target)
- `onConnect` fires when user draws a connection
- Store and sync connections separately from React Flow's internal edge state

### Performance Tips
- Memoize node components with custom equality checks
- Only update store on meaningful changes (not every frame)
- Use viewport culling for large canvases (50+ nodes)

---

## Styling Notes

The implementation uses Tailwind CSS classes. Key classes:
- Canvas background: `bg-gray-950`
- Toolbar: `bg-gray-900/95 backdrop-blur-sm`
- Nodes: `bg-white rounded-lg shadow-lg`
- Handles: `w-3 h-3 bg-blue-500` (input) / `bg-green-500` (output)

Customize these to match your design system.

---

## Common Customizations

### Disable Connections
Remove `<Handle>` components from nodes and skip `onConnect` handler.

### Custom Edge Styles
Modify the edge object in `edges` memo and `onConnect`:
```typescript
style: { stroke: '#your-color', strokeWidth: 2, strokeDasharray: '5,5' }
```

### Snap to Grid
Add to ReactFlow:
```tsx
<ReactFlow
  snapToGrid={true}
  snapGrid={[20, 20]}
  // ...
/>
```

### Persist to localStorage
```typescript
// In store
useEffect(() => {
  const state = { exampleBlocks, connections };
  localStorage.setItem('canvas-state', JSON.stringify(state));
}, [exampleBlocks, connections]);

// On mount
const saved = localStorage.getItem('canvas-state');
if (saved) loadState(JSON.parse(saved));
```

---

This guide provides the foundation for building a canvas-based application. Adapt the node types, toolbar items, and styling to match your specific project requirements.
