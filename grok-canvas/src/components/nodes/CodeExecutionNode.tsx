import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Code } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
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
      <div className="space-y-5">
        <div className="flex items-center gap-3 bg-gray-900/60 rounded-xl px-4 py-3 border border-gray-700/50">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
          <span className="text-[13px] text-gray-300 font-medium">grok-4-1-fast (Python Sandbox)</span>
        </div>

        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Task Description</label>
          <textarea
            value={nodeData.description}
            onChange={(e) => updateBlock(id, { description: e.target.value })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:bg-gray-900/80 resize-none font-mono transition-all duration-200 leading-relaxed"
            placeholder="Describe the computation task..."
            rows={3}
          />
        </div>

        <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/50">
          <span className="text-[12px] text-gray-500 block mb-3 font-medium tracking-wide uppercase">Capabilities</span>
          <div className="flex flex-wrap gap-2">
            {['Math', 'Data Analysis', 'Statistics', 'Visualization'].map((cap) => (
              <span
                key={cap}
                className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-[12px] font-semibold"
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
