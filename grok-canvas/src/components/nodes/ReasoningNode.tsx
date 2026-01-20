import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Brain, Zap, Sparkles } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
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
      <div className="space-y-4 px-1">
        <div className="flex items-center gap-3 bg-[#0f1318] rounded-xl px-4 py-3 border-2 border-[#3a4451]">
          <div className="w-2.5 h-2.5 bg-pink-500 rounded-full" />
          <span className="text-[13px] text-gray-300 font-medium">grok-3-mini (Reasoning)</span>
        </div>

        <div>
          <Label>System Prompt</Label>
          <textarea
            value={nodeData.systemPrompt}
            onChange={(e) => updateBlock(id, { systemPrompt: e.target.value })}
            placeholder="You are a highly intelligent AI assistant..."
            rows={3}
            className="w-full bg-[#0f1318] border-2 border-[#3a4451] rounded-xl text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#4a5568] transition-colors resize-none"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
        </div>

        <div>
          <Label>Reasoning Effort</Label>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => updateBlock(id, { reasoningEffort: 'low' })}
              className={cn(
                'flex-1 py-4 px-4 rounded-xl transition-colors flex flex-col items-center gap-2 border-2',
                nodeData.reasoningEffort === 'low'
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-[#0f1318] text-gray-400 hover:text-white border-[#3a4451] hover:border-[#4a5568]'
              )}
            >
              <Zap size={20} />
              <span className="text-[13px] font-medium">Low</span>
              <span className="text-[11px] opacity-70">Quick</span>
            </button>
            <button
              onClick={() => updateBlock(id, { reasoningEffort: 'high' })}
              className={cn(
                'flex-1 py-4 px-4 rounded-xl transition-colors flex flex-col items-center gap-2 border-2',
                nodeData.reasoningEffort === 'high'
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-[#0f1318] text-gray-400 hover:text-white border-[#3a4451] hover:border-[#4a5568]'
              )}
            >
              <Sparkles size={20} />
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
