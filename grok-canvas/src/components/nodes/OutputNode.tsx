import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { ArrowRightFromLine } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { OutputBlock } from '../../types/canvas';

const OutputNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as OutputBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  return (
    <BaseNode
      id={id}
      title="Output"
      icon={<ArrowRightFromLine size={18} strokeWidth={2} />}
      color="#64748b"
      hasOutput={false}
      width={nodeData.size.width}
    >
      <div className="space-y-3">
        <div>
          <Label>Label</Label>
          <Input
            value={nodeData.label}
            onChange={(e) => updateBlock(id, { label: e.target.value })}
            placeholder="Output label"
          />
        </div>

        <div className="bg-[#0f1318] border border-[#2a3441] rounded-lg p-3 min-h-[100px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-[11px] text-gray-500 font-medium uppercase">
              Response Preview
            </span>
          </div>
          {nodeData.outputValue ? (
            <pre className="text-[13px] text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              {nodeData.outputValue}
            </pre>
          ) : (
            <span className="text-[12px] text-gray-500 italic">
              Connect to a model block to see output...
            </span>
          )}
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(OutputNode);
