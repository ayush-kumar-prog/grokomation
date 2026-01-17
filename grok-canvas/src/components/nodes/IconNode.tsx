import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Eye, Code, Brain, Globe, X, Image } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

// X Logo component
const XLogo: React.FC<{ size?: number; color?: string }> = ({ size = 28, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface IconNodeData {
  type: 'vision' | 'codeExecution' | 'reasoning' | 'webSearch' | 'xFetch' | 'imageInput';
  size: { width: number; height: number };
}

const iconConfig: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  vision: {
    icon: Eye,
    color: '#f59e0b',
    label: 'Vision',
  },
  codeExecution: {
    icon: Code,
    color: '#ef4444',
    label: 'Code',
  },
  reasoning: {
    icon: Brain,
    color: '#ec4899',
    label: 'Reasoning',
  },
  webSearch: {
    icon: Globe,
    color: '#3b82f6',
    label: 'Web',
  },
  xFetch: {
    icon: XLogo,
    color: '#ffffff',
    label: 'X',
  },
  imageInput: {
    icon: Image,
    color: '#8b5cf6',
    label: 'Image',
  },
};

const IconNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as IconNodeData;
  const removeBlock = useCanvasStore((s) => s.removeBlock);
  const config = iconConfig[nodeData.type];
  const Icon = config.icon;

  return (
    <div
      className="relative group"
      style={{
        width: '80px',
        height: '80px',
      }}
    >
      {/* Delete button - shows on hover */}
      <button
        onClick={() => removeBlock(id)}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 hover:bg-red-600"
        style={{ fontSize: '10px' }}
      >
        <X size={12} />
      </button>

      {/* Main icon container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`,
          border: `2px solid ${config.color}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <Icon size={28} color={config.color} strokeWidth={2} />
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: config.color,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {config.label}
        </span>
      </div>

      {/* Handles on all sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          width: '10px',
          height: '10px',
          background: config.color,
          border: '2px solid #1a1f25',
          top: '-5px',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          width: '10px',
          height: '10px',
          background: config.color,
          border: '2px solid #1a1f25',
          left: '-5px',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          width: '10px',
          height: '10px',
          background: config.color,
          border: '2px solid #1a1f25',
          right: '-5px',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          width: '10px',
          height: '10px',
          background: config.color,
          border: '2px solid #1a1f25',
          bottom: '-5px',
        }}
      />
    </div>
  );
};

export default memo(IconNode);
