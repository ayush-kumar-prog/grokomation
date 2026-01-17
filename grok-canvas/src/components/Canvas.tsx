import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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

  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);
  const selectedTool = useCanvasStore((s) => s.selectedTool);

  const setSelectedTool = useCanvasStore((s) => s.setSelectedTool);
  const addBlock = useCanvasStore((s) => s.addBlock);
  const updateBlockPosition = useCanvasStore((s) => s.updateBlockPosition);
  const removeBlock = useCanvasStore((s) => s.removeBlock);
  const addConnection = useCanvasStore((s) => s.addConnection);
  const removeConnectionByEdgeId = useCanvasStore((s) => s.removeConnectionByEdgeId);

  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    if (selectedTool !== 'select') {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [selectedTool]);

  const nodes = useMemo(() => {
    return blocks.map((block) => ({
      id: block.id,
      type: block.type,
      position: block.position,
      data: block as unknown as Record<string, unknown>,
      dragHandle: '.drag-handle',
    }));
  }, [blocks]);

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

  const [localEdges, setLocalEdges] = useState<Edge[]>(edges);

  useEffect(() => {
    setLocalEdges(edges);
  }, [edges]);

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

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateBlockPosition(node.id, node.position);
    },
    [updateBlockPosition]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      deletedNodes.forEach((node) => {
        removeBlock(node.id);
      });
    },
    [removeBlock]
  );

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

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setLocalEdges((eds) => eds.filter((e) => e.id !== edge.id));
      removeConnectionByEdgeId(edge.id);
    },
    [removeConnectionByEdgeId]
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setLocalEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0f1318]">
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
        className="!bg-[#0f1318]"
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#2a3441"
        />

        <Controls
          className="!bg-[#1a1f25] !border-[#2a3441] !rounded-lg [&>button]:!bg-[#1a1f25] [&>button]:!border-[#2a3441] [&>button]:!text-gray-400 [&>button:hover]:!bg-[#252d38] [&>button:hover]:!text-white"
          showInteractive={false}
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
          <div className="bg-[#1a1f25] border border-[#2a3441] rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm text-gray-300">Click to place block</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
