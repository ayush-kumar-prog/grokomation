import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import type { TextCompletionBlock } from '../../types/canvas';

const TextCompletionNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as TextCompletionBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  return (
    <BaseNode
      id={id}
      title="Text Completion"
      icon={<MessageSquare size={18} strokeWidth={2} />}
      color="#10b981"
      width={nodeData.size.width}
    >
      <div className="space-y-5">
        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Model</label>
          <select
            value={nodeData.model}
            onChange={(e) => updateBlock(id, { model: e.target.value as TextCompletionBlock['model'] })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-emerald-500/50 focus:bg-gray-900/80 transition-all duration-200 cursor-pointer"
          >
            <option value="grok-4">Grok 4</option>
            <option value="grok-4-fast">Grok 4 Fast</option>
            <option value="grok-3-mini">Grok 3 Mini</option>
          </select>
        </div>

        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">System Prompt</label>
          <textarea
            value={nodeData.systemPrompt}
            onChange={(e) => updateBlock(id, { systemPrompt: e.target.value })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-gray-900/80 resize-none transition-all duration-200 leading-relaxed"
            placeholder="You are a helpful assistant..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">
              Temperature
              <span className="ml-2 text-emerald-400 font-semibold">{nodeData.temperature}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={nodeData.temperature}
              onChange={(e) => updateBlock(id, { temperature: parseFloat(e.target.value) })}
              className="w-full h-2"
            />
          </div>
          <div>
            <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Max Tokens</label>
            <input
              type="number"
              value={nodeData.maxTokens}
              onChange={(e) => updateBlock(id, { maxTokens: parseInt(e.target.value) || 1024 })}
              className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-emerald-500/50 focus:bg-gray-900/80 transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(TextCompletionNode);
