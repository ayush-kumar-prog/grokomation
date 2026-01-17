import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Image, Upload } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Label } from '../ui/label';
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
      <div className="space-y-4 px-1">
        <div>
          <Label>Image URL</Label>
          <input
            value={nodeData.imageUrl}
            onChange={(e) => updateBlock(id, { imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="w-full bg-[#0f1318] border-2 border-[#3a4451] rounded-xl text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#4a5568] transition-colors"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
        </div>

        {nodeData.imageUrl ? (
          <div className="rounded-xl overflow-hidden border-2 border-[#3a4451]">
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
          <div className="rounded-xl border-2 border-dashed border-[#3a4451] bg-[#0f1318] p-6 flex flex-col items-center justify-center gap-3">
            <Upload size={24} className="text-gray-500" />
            <span className="text-[13px] text-gray-500">Paste image URL above</span>
          </div>
        )}

        <div>
          <Label>Detail Level</Label>
          <select
            value={nodeData.detail}
            onChange={(e) => updateBlock(id, { detail: e.target.value as 'auto' | 'low' | 'high' })}
            className="w-full bg-[#0f1318] border-2 border-[#3a4451] rounded-xl text-[14px] text-white focus:outline-none focus:border-[#4a5568] transition-colors cursor-pointer"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
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
