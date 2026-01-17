import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Image, Upload } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import type { ImageInputBlock } from '../../types/canvas';

const ImageInputNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as ImageInputBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  return (
    <BaseNode
      id={id}
      title="Image Input"
      icon={<Image size={18} strokeWidth={2} />}
      color="#8b5cf6"
      hasInput={false}
      width={nodeData.size.width}
    >
      <div className="space-y-5">
        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Image URL</label>
          <input
            type="text"
            value={nodeData.imageUrl}
            onChange={(e) => updateBlock(id, { imageUrl: e.target.value })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900/80 transition-all duration-200"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {nodeData.imageUrl ? (
          <div className="rounded-xl overflow-hidden border border-gray-700/50 bg-gray-900/40">
            <img
              src={nodeData.imageUrl}
              alt="Preview"
              className="w-full h-28 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-700/50 bg-gray-900/30 p-6 flex flex-col items-center justify-center gap-2">
            <Upload size={24} className="text-gray-600" />
            <span className="text-[13px] text-gray-500">Paste image URL above</span>
          </div>
        )}

        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Detail Level</label>
          <select
            value={nodeData.detail}
            onChange={(e) => updateBlock(id, { detail: e.target.value as 'auto' | 'low' | 'high' })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-purple-500/50 focus:bg-gray-900/80 transition-all duration-200 cursor-pointer"
          >
            <option value="auto">Auto</option>
            <option value="low">Low</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(ImageInputNode);
