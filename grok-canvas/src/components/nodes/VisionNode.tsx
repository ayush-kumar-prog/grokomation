import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Eye } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
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
      <div className="space-y-5">
        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Model</label>
          <select
            value={nodeData.model}
            onChange={(e) => updateBlock(id, { model: e.target.value as VisionBlock['model'] })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-amber-500/50 focus:bg-gray-900/80 transition-all duration-200 cursor-pointer"
          >
            <option value="grok-4">Grok 4</option>
            <option value="grok-4-fast">Grok 4 Fast</option>
          </select>
        </div>

        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Analysis Prompt</label>
          <textarea
            value={nodeData.prompt}
            onChange={(e) => updateBlock(id, { prompt: e.target.value })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900/80 resize-none transition-all duration-200 leading-relaxed"
            placeholder="What would you like to know about the image?"
            rows={3}
          />
        </div>

        <div>
          <label className="text-[13px] text-gray-400 mb-3 block font-medium tracking-wide">Detail Level</label>
          <div className="flex gap-2">
            {(['auto', 'low', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => updateBlock(id, { detail: level })}
                className={`flex-1 py-2.5 px-4 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                  nodeData.detail === level
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/80 border border-gray-700/50'
                }`}
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
