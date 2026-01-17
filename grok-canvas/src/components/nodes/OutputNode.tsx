import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { ArrowRightFromLine } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
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
      <div className="space-y-5">
        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Label</label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => updateBlock(id, { label: e.target.value })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-slate-500/50 focus:bg-gray-900/80 transition-all duration-200"
            placeholder="Output label"
          />
        </div>

        <div className="bg-[#0a0d10] border border-gray-800/60 rounded-xl p-4 min-h-[120px]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-soft" />
            <span className="text-[12px] text-gray-500 font-medium tracking-wide uppercase">Response Preview</span>
          </div>
          {nodeData.outputValue ? (
            <pre className="text-[13px] text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              {nodeData.outputValue}
            </pre>
          ) : (
            <span className="text-[13px] text-gray-600 italic">
              Connect to a model block to see output...
            </span>
          )}
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(OutputNode);
