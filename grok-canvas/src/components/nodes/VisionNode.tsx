import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Eye } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
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
      <div className="space-y-4 px-1">
        <div>
          <Label>Model</Label>
          <select
            value={nodeData.model}
            onChange={(e) => updateBlock(id, { model: e.target.value as VisionBlock['model'] })}
            className="w-full bg-[#0f1318] border-2 border-[#3a4451] rounded-xl text-[14px] text-white focus:outline-none focus:border-[#4a5568] transition-colors cursor-pointer"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          >
            <option value="grok-4">Grok 4</option>
            <option value="grok-4-fast">Grok 4 Fast</option>
          </select>
        </div>

        <div>
          <Label>Analysis Prompt</Label>
          <textarea
            value={nodeData.prompt}
            onChange={(e) => updateBlock(id, { prompt: e.target.value })}
            placeholder="What would you like to know about the image?"
            rows={3}
            className="w-full bg-[#0f1318] border-2 border-[#3a4451] rounded-xl text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#4a5568] transition-colors resize-none"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
        </div>

        <div>
          <Label>Detail Level</Label>
          <div className="flex gap-3 mt-2">
            {(['auto', 'low', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => updateBlock(id, { detail: level })}
                className={cn(
                  'flex-1 py-3 px-4 text-[13px] font-medium rounded-xl transition-colors border-2',
                  nodeData.detail === level
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-[#0f1318] text-gray-400 hover:text-white border-[#3a4451] hover:border-[#4a5568]'
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
