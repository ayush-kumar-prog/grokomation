import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { X, GripHorizontal } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface BaseNodeProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  hasInput?: boolean;
  hasOutput?: boolean;
  width?: number;
  height?: number;
}

const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  title,
  icon,
  color,
  children,
  hasInput = true,
  hasOutput = true,
  width = 320,
  height,
}) => {
  const removeBlock = useCanvasStore((s) => s.removeBlock);

  return (
    <div
      className="bg-[#0f1419] rounded-2xl border border-gray-800/60 shadow-2xl shadow-black/40 overflow-visible relative"
      style={{ width, height }}
    >
      {/* Top Control Bar - Drag and Delete */}
      <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700/40 shadow-xl px-1.5 py-1.5">
        <div
          className="drag-handle cursor-grab active:cursor-grabbing p-2 text-gray-500 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-150"
          title="Drag to move"
        >
          <GripHorizontal size={14} strokeWidth={2.5} />
        </div>
        <div className="w-px h-4 bg-gray-700/50 mx-0.5" />
        <button
          onClick={() => removeBlock(id)}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/15 rounded-lg transition-all duration-150"
          title="Delete"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-[#0f1419]"
        style={{ top: -5 }}
      />

      {/* Left Handle (Input) */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-[#0f1419]"
          style={{ left: -5 }}
        />
      )}

      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center gap-3 rounded-t-2xl"
        style={{ backgroundColor: color }}
      >
        <span className="text-white/90">{icon}</span>
        <span className="text-[15px] font-semibold text-white tracking-tight">{title}</span>
      </div>

      {/* Content */}
      <div className="p-5">{children}</div>

      {/* Right Handle (Output) */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-[#0f1419]"
          style={{ right: -5 }}
        />
      )}

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-orange-500 !border-2 !border-[#0f1419]"
        style={{ bottom: -5 }}
      />
    </div>
  );
};

export default BaseNode;
