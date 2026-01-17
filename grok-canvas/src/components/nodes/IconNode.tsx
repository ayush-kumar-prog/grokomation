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

const iconConfig: Record<string, { icon: React.ComponentType<any>; label: string }> = {
  vision: {
    icon: Eye,
    label: 'VISION',
  },
  codeExecution: {
    icon: Code,
    label: 'CODE',
  },
  reasoning: {
    icon: Brain,
    label: 'REASON',
  },
  webSearch: {
    icon: Globe,
    label: 'WEB',
  },
  xFetch: {
    icon: XLogo,
    label: 'X',
  },
  imageInput: {
    icon: Image,
    label: 'IMAGE',
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
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
        style={{
          width: '20px',
          height: '20px',
          background: '#000000',
          color: '#ffffff',
          border: '2px solid #000000',
        }}
      >
        <X size={12} />
      </button>

      {/* Main icon container - Brutalist */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#ffffff',
          border: '3px solid #000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          cursor: 'pointer',
          transition: 'all 0.1s',
        }}
      >
        <Icon size={28} color="#000000" strokeWidth={2} />
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {config.label}
        </span>
      </div>

      {/* Handles on all sides - Brutalist square */}
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
          top: '-6px',
        }}
      />
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
          left: '-6px',
        }}
      />
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
          right: '-6px',
        }}
      />
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
          bottom: '-6px',
        }}
      />
    </div>
  );
};

export default memo(IconNode);
