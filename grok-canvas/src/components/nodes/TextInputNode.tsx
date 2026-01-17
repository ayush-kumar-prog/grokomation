import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Type } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import type { TextInputBlock } from '../../types/canvas';

const TextInputNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as TextInputBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  return (
    <BaseNode
      id={id}
      title="Text Input"
      icon={<Type size={18} strokeWidth={2} />}
      color="#6366f1"
      hasInput={false}
      width={nodeData.size.width}
    >
      <div className="space-y-5">
        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Label</label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => updateBlock(id, { label: e.target.value })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-gray-900/80 transition-all duration-200"
            placeholder="Enter label..."
          />
        </div>
        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Content</label>
          <textarea
            value={nodeData.value}
            onChange={(e) => updateBlock(id, { value: e.target.value })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-gray-900/80 resize-none transition-all duration-200 leading-relaxed"
            placeholder={nodeData.placeholder}
            rows={4}
          />
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(TextInputNode);
