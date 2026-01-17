import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Type } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import type { TextInputBlock } from '../../types/canvas';

const TextInputNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as TextInputBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  return (
    <BaseNode
      id={id}
      title="Text Input"
      icon={<Type size={18} strokeWidth={2} />}
      color="#6366f1"
      hasInput={false}
      width={nodeData.size.width}
    >
      <div className="space-y-3">
        <div>
          <Label>Label</Label>
          <Input
            value={nodeData.label}
            onChange={(e) => updateBlock(id, { label: e.target.value })}
            placeholder="Enter label..."
          />
        </div>
        <div>
          <Label>Content</Label>
          <Textarea
            value={nodeData.value}
            onChange={(e) => updateBlock(id, { value: e.target.value })}
            placeholder={nodeData.placeholder}
            rows={4}
          />
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(TextInputNode);
