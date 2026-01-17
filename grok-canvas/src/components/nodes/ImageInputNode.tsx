import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Image, Upload } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
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
      <div className="space-y-3">
        <div>
          <Label>Image URL</Label>
          <Input
            value={nodeData.imageUrl}
            onChange={(e) => updateBlock(id, { imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {nodeData.imageUrl ? (
          <div className="rounded-lg overflow-hidden border border-[#2a3441]">
            <img
              src={nodeData.imageUrl}
              alt="Preview"
              className="w-full h-24 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-[#2a3441] bg-[#0f1318] p-5 flex flex-col items-center justify-center gap-2">
            <Upload size={20} className="text-gray-500" />
            <span className="text-[12px] text-gray-500">Paste image URL above</span>
          </div>
        )}

        <div>
          <Label>Detail Level</Label>
          <Select
            value={nodeData.detail}
            onChange={(e) => updateBlock(id, { detail: e.target.value as 'auto' | 'low' | 'high' })}
          >
            <option value="auto">Auto</option>
            <option value="low">Low</option>
            <option value="high">High</option>
          </Select>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(ImageInputNode);
