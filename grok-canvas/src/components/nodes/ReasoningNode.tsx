import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Brain } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import type { ReasoningBlock } from '../../types/canvas';

const ReasoningNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as ReasoningBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  return (
    <BaseNode
      id={id}
      title="Reasoning"
      icon={<Brain size={18} strokeWidth={2} />}
      color="#ec4899"
      width={nodeData.size.width}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 bg-gray-900/60 rounded-xl px-4 py-3 border border-gray-700/50">
          <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse-soft" />
          <span className="text-[13px] text-gray-300 font-medium">grok-3-mini (Reasoning Model)</span>
        </div>

        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">System Prompt</label>
          <textarea
            value={nodeData.systemPrompt}
            onChange={(e) => updateBlock(id, { systemPrompt: e.target.value })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 focus:bg-gray-900/80 resize-none transition-all duration-200 leading-relaxed"
            placeholder="You are a highly intelligent AI assistant..."
            rows={3}
          />
        </div>

        <div>
          <label className="text-[13px] text-gray-400 mb-3 block font-medium tracking-wide">Reasoning Effort</label>
          <div className="flex gap-3">
            <button
              onClick={() => updateBlock(id, { reasoningEffort: 'low' })}
              className={`flex-1 py-4 px-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 ${
                nodeData.reasoningEffort === 'low'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/80 border border-gray-700/50'
              }`}
            >
              <span className="text-[14px] font-semibold">Low</span>
              <span className="text-[11px] opacity-70">Quick Response</span>
            </button>
            <button
              onClick={() => updateBlock(id, { reasoningEffort: 'high' })}
              className={`flex-1 py-4 px-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 ${
                nodeData.reasoningEffort === 'high'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/80 border border-gray-700/50'
              }`}
            >
              <span className="text-[14px] font-semibold">High</span>
              <span className="text-[11px] opacity-70">Deep Thinking</span>
            </button>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(ReasoningNode);
