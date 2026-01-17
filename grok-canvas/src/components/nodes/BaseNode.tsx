import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { X, GripHorizontal } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import { cn } from '@/lib/utils';

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
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="relative"
      style={{ width, height }}
    >
      {/* Main card */}
      <div className="bg-[#1e242c] rounded-2xl border-2 border-[#3a4451] shadow-xl overflow-visible relative">
        {/* Top Control Bar */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1a1f25] rounded-lg border border-[#2a3441] px-1 py-1">
          <div
            className="drag-handle cursor-grab active:cursor-grabbing p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Drag to move"
          >
            <GripHorizontal size={14} strokeWidth={2} />
          </div>
          <div className="w-px h-4 bg-[#2a3441]" />
          <button
            onClick={() => removeBlock(id)}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            title="Delete"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Top Handle */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className={cn(
            '!w-2.5 !h-2.5 !border-2 !border-[#1a1f25] transition-transform hover:!scale-125',
            '!bg-purple-500'
          )}
          style={{ top: -5 }}
        />

        {/* Left Handle (Input) */}
        {hasInput && (
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            className={cn(
              '!w-2.5 !h-2.5 !border-2 !border-[#1a1f25] transition-transform hover:!scale-125',
              '!bg-blue-500'
            )}
            style={{ left: -5 }}
          />
        )}

        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-3 rounded-t-2xl"
          style={{ backgroundColor: color }}
        >
          <span className="text-white">{icon}</span>
          {title && <span className="text-[15px] font-semibold text-white">{title}</span>}
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>

        {/* Right Handle (Output) */}
        {hasOutput && (
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className={cn(
              '!w-2.5 !h-2.5 !border-2 !border-[#1a1f25] transition-transform hover:!scale-125',
              '!bg-emerald-500'
            )}
            style={{ right: -5 }}
          />
        )}

        {/* Bottom Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className={cn(
            '!w-2.5 !h-2.5 !border-2 !border-[#1a1f25] transition-transform hover:!scale-125',
            '!bg-orange-500'
          )}
          style={{ bottom: -5 }}
        />
      </div>
    </motion.div>
  );
};

export default BaseNode;
