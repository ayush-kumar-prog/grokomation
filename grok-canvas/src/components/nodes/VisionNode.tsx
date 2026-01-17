import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Eye } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import type { VisionBlock } from '../../types/canvas';

const VisionNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as VisionBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  return (
    <BaseNode
      id={id}
      title="Vision Analysis"
      icon={<Eye size={18} strokeWidth={2} />}
      color="#f59e0b"
      width={nodeData.size.width}
    >
      <div className="space-y-3">
        <div>
          <Label>Model</Label>
          <Select
            value={nodeData.model}
            onChange={(e) => updateBlock(id, { model: e.target.value as VisionBlock['model'] })}
          >
            <option value="grok-4">Grok 4</option>
            <option value="grok-4-fast">Grok 4 Fast</option>
          </Select>
        </div>

        <div>
          <Label>Analysis Prompt</Label>
          <Textarea
            value={nodeData.prompt}
            onChange={(e) => updateBlock(id, { prompt: e.target.value })}
            placeholder="What would you like to know about the image?"
            rows={3}
          />
        </div>

        <div>
          <Label>Detail Level</Label>
          <div className="flex gap-2 mt-1">
            {(['auto', 'low', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => updateBlock(id, { detail: level })}
                className={cn(
                  'flex-1 py-2 px-3 text-[13px] font-medium rounded-lg transition-colors',
                  nodeData.detail === level
                    ? 'bg-amber-500 text-white'
                    : 'bg-[#0f1318] text-gray-400 hover:text-white border border-[#2a3441]'
                )}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(VisionNode);
