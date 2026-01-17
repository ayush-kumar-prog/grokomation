import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Code } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import type { CodeExecutionBlock } from '../../types/canvas';

const CodeExecutionNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as CodeExecutionBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  return (
    <BaseNode
      id={id}
      title="Code Execution"
      icon={<Code size={18} strokeWidth={2} />}
      color="#ef4444"
      width={nodeData.size.width}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 bg-[#0f1318] rounded-lg px-3 py-2.5 border border-[#2a3441]">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-[13px] text-gray-300 font-medium">grok-4-1-fast (Python)</span>
        </div>

        <div>
          <Label>Task Description</Label>
          <Textarea
            value={nodeData.description}
            onChange={(e) => updateBlock(id, { description: e.target.value })}
            placeholder="Describe the computation task..."
            rows={3}
            className="font-mono"
          />
        </div>

        <div className="bg-[#0f1318] rounded-lg p-3 border border-[#2a3441]">
          <span className="text-[11px] text-gray-500 block mb-2 font-medium uppercase">
            Capabilities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['Math', 'Data Analysis', 'Statistics', 'Visualization'].map((cap) => (
              <span
                key={cap}
                className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-[11px] font-medium"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(CodeExecutionNode);
