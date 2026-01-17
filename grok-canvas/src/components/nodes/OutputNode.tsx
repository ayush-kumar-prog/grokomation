import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { ArrowRightFromLine } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
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
      <div className="space-y-4 px-1">
        <div>
          <Label>Label</Label>
          <input
            value={nodeData.label}
            onChange={(e) => updateBlock(id, { label: e.target.value })}
            placeholder="Output label"
            className="w-full bg-[#0f1318] border-2 border-[#3a4451] rounded-xl text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#4a5568] transition-colors"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
        </div>

        <div className="bg-[#0f1318] border-2 border-[#3a4451] rounded-xl p-4 min-h-[120px]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
              Response Preview
            </span>
          </div>
          {nodeData.outputValue ? (
            <pre className="text-[13px] text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              {nodeData.outputValue}
            </pre>
          ) : (
            <span className="text-[13px] text-gray-500 italic">
              Connect to a model block to see output...
            </span>
          )}
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(OutputNode);
