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
  type EdgeChange,
  addEdge,
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
  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);
  const selectedTool = useCanvasStore((s) => s.selectedTool);

  // Get actions from store
  const setSelectedTool = useCanvasStore((s) => s.setSelectedTool);
  const addBlock = useCanvasStore((s) => s.addBlock);
  const updateBlockPosition = useCanvasStore((s) => s.updateBlockPosition);
  const removeBlock = useCanvasStore((s) => s.removeBlock);
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
  const nodes = useMemo(() => {
    return blocks.map((block) => ({
      id: block.id,
      type: block.type,
      position: block.position,
      data: block as unknown as Record<string, unknown>,
      dragHandle: '.drag-handle', // Only allow dragging from the drag handle
    }));
  }, [blocks]);

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
      if (selectedTool === 'select') return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addBlock(selectedTool, position);
      setSelectedTool('select');
    },
    [selectedTool, screenToFlowPosition, addBlock, setSelectedTool]
  );

  // Handle node position changes after drag
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateBlockPosition(node.id, node.position);
    },
    [updateBlockPosition]
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      deletedNodes.forEach((node) => {
        removeBlock(node.id);
      });
    },
    [removeBlock]
  );

  // Handle new connections
  const onConnect = useCallback(
    (params: FlowConnection) => {
      if (!params.source || !params.target) return;

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

  // Handle edge changes
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setLocalEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={localEdges}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift']}
        panOnDrag={selectedTool === 'select'}
        selectionOnDrag={false}
        className="bg-gray-950"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
      >
        {/* Grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#374151"
        />

        {/* Zoom controls */}
        <Controls
          className="!bg-gray-800 !border-gray-700 !rounded-lg !shadow-xl [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-300 [&>button:hover]:!bg-gray-700"
          showInteractive={false}
        />

        {/* Mini map */}
        <MiniMap
          className="!bg-gray-800 !border-gray-700 !rounded-lg"
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              textInput: '#6366f1',
              imageInput: '#8b5cf6',
              textCompletion: '#10b981',
              vision: '#f59e0b',
              reasoning: '#ec4899',
              webSearch: '#3b82f6',
              xSearch: '#1d9bf0',
              codeExecution: '#ef4444',
              output: '#64748b',
            };
            return colors[node.type || ''] || '#3b82f6';
          }}
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
          <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 shadow-xl">
            <span className="text-xs text-gray-300">
              Click to place block
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
