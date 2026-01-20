import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Type } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Label } from '../ui/label';
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
      <div className="space-y-4 px-1">
        <div>
          <Label>Label</Label>
          <input
            value={nodeData.label}
            onChange={(e) => updateBlock(id, { label: e.target.value })}
            placeholder="Enter label..."
            className="w-full bg-[#0f1318] border-2 border-[#3a4451] rounded-xl text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#4a5568] transition-colors"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
        </div>
        <div>
          <Label>Content</Label>
          <textarea
            value={nodeData.value}
            onChange={(e) => updateBlock(id, { value: e.target.value })}
            placeholder={nodeData.placeholder}
            rows={4}
            className="w-full bg-[#0f1318] border-2 border-[#3a4451] rounded-xl text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#4a5568] transition-colors resize-none"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(TextInputNode);
