import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
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
      {/* Main card - Brutalist */}
      <div
        className="overflow-visible relative"
        style={{
          background: '#ffffff',
          border: '3px solid #000000',
        }}
      >
        {/* Top Control Bar */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0"
          style={{
            background: '#ffffff',
            border: '2px solid #000000',
          }}
        >
          <div
            className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center transition-colors"
            title="Drag to move"
            style={{
              width: '32px',
              height: '32px',
              background: '#ffffff',
              color: '#000000',
              borderRight: '2px solid #000000',
            }}
          >
            <GripHorizontal size={14} strokeWidth={2} />
          </div>
          <button
            onClick={() => removeBlock(id)}
            className="flex items-center justify-center transition-colors"
            title="Delete"
            style={{
              width: '32px',
              height: '32px',
              background: '#000000',
              color: '#ffffff',
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Top Handle */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{
            width: '12px',
            height: '12px',
            background: '#ffffff',
            border: '2px solid #000000',
            borderRadius: 0,
            top: -6,
          }}
        />

        {/* Left Handle (Input) */}
        {hasInput && (
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            style={{
              width: '12px',
              height: '12px',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 0,
              left: -6,
            }}
          />
        )}

        {/* Header - Brutalist */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{
            background: '#000000',
            borderBottom: '3px solid #000000',
          }}
        >
          <span style={{ color: '#ffffff' }}>{icon}</span>
          {title && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {title}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>

        {/* Right Handle (Output) */}
        {hasOutput && (
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            style={{
              width: '12px',
              height: '12px',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 0,
              right: -6,
            }}
          />
        )}

        {/* Bottom Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{
            width: '12px',
            height: '12px',
            background: '#ffffff',
            border: '2px solid #000000',
            borderRadius: 0,
            bottom: -6,
          }}
        />
      </div>
    </motion.div>
  );
};

export default BaseNode;
