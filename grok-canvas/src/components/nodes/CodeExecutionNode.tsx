import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Code } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
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
      <div className="space-y-4 px-1">
        {/* Language Badge */}
        <div className="flex items-center gap-3 bg-[#0f1318] rounded-xl px-4 py-3 border-2 border-[#3a4451]">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
          <span className="text-[13px] text-gray-300 font-medium">Python Runtime</span>
        </div>

        {/* Timeout */}
        <div>
          <Label className="flex items-center justify-between">
            Timeout (seconds)
            <span className="text-red-400 font-semibold">{nodeData.timeout}s</span>
          </Label>
          <div className="bg-[#0f1318] border-2 border-[#3a4451] rounded-xl p-4 mt-1">
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={nodeData.timeout}
              onChange={(e) => updateBlock(id, { timeout: parseInt(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#3a4451] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500"
            />
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-[#0f1318] rounded-xl p-4 border-2 border-[#3a4451]">
          <span className="text-[11px] text-gray-500 block mb-3 font-medium uppercase tracking-wide">
            Capabilities
          </span>
          <div className="flex flex-wrap gap-2">
            {['Math', 'Data Analysis', 'Statistics', 'Visualization'].map((cap) => (
              <span
                key={cap}
                className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-[12px] font-medium"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-[#0f1318] rounded-xl p-4 border-2 border-[#3a4451]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
              Input
            </span>
          </div>
          <p className="text-[12px] text-gray-400">
            Connect a TextInput or GrokChat with code/task description
          </p>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(CodeExecutionNode);
