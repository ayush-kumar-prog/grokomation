import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Brain, Zap, Sparkles } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
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
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 bg-[#0f1318] rounded-lg px-3 py-2.5 border border-[#2a3441]">
          <div className="w-2 h-2 bg-pink-500 rounded-full" />
          <span className="text-[13px] text-gray-300 font-medium">grok-3-mini (Reasoning)</span>
        </div>

        <div>
          <Label>System Prompt</Label>
          <Textarea
            value={nodeData.systemPrompt}
            onChange={(e) => updateBlock(id, { systemPrompt: e.target.value })}
            placeholder="You are a highly intelligent AI assistant..."
            rows={3}
          />
        </div>

        <div>
          <Label>Reasoning Effort</Label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => updateBlock(id, { reasoningEffort: 'low' })}
              className={cn(
                'flex-1 py-3 px-3 rounded-lg transition-colors flex flex-col items-center gap-1.5',
                nodeData.reasoningEffort === 'low'
                  ? 'bg-pink-500 text-white'
                  : 'bg-[#0f1318] text-gray-400 hover:text-white border border-[#2a3441]'
              )}
            >
              <Zap size={18} />
              <span className="text-[13px] font-medium">Low</span>
              <span className="text-[11px] opacity-70">Quick</span>
            </button>
            <button
              onClick={() => updateBlock(id, { reasoningEffort: 'high' })}
              className={cn(
                'flex-1 py-3 px-3 rounded-lg transition-colors flex flex-col items-center gap-1.5',
                nodeData.reasoningEffort === 'high'
                  ? 'bg-pink-500 text-white'
                  : 'bg-[#0f1318] text-gray-400 hover:text-white border border-[#2a3441]'
              )}
            >
              <Sparkles size={18} />
              <span className="text-[13px] font-medium">High</span>
              <span className="text-[11px] opacity-70">Deep</span>
            </button>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(ReasoningNode);
