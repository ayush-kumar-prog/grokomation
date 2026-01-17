import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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
      <div className="space-y-3">
        <div>
          <Label>Model</Label>
          <Select
            value={nodeData.model}
            onChange={(e) => updateBlock(id, { model: e.target.value as TextCompletionBlock['model'] })}
          >
            <option value="grok-4">Grok 4</option>
            <option value="grok-4-fast">Grok 4 Fast</option>
            <option value="grok-3-mini">Grok 3 Mini</option>
          </Select>
        </div>

        <div>
          <Label>System Prompt</Label>
          <Textarea
            value={nodeData.systemPrompt}
            onChange={(e) => updateBlock(id, { systemPrompt: e.target.value })}
            placeholder="You are a helpful assistant..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="flex items-center justify-between">
              Temperature
              <span className="text-emerald-400 font-semibold">{nodeData.temperature}</span>
            </Label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={nodeData.temperature}
              onChange={(e) => updateBlock(id, { temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 mt-2 rounded-full appearance-none cursor-pointer bg-[#2a3441] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
            />
          </div>
          <div>
            <Label>Max Tokens</Label>
            <Input
              type="number"
              value={nodeData.maxTokens}
              onChange={(e) => updateBlock(id, { maxTokens: parseInt(e.target.value) || 1024 })}
            />
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(TextCompletionNode);
