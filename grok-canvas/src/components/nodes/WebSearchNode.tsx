import React, { memo, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Globe, Plus, X } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import type { WebSearchBlock } from '../../types/canvas';

const WebSearchNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as WebSearchBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const [newDomain, setNewDomain] = useState('');
  const [filterMode, setFilterMode] = useState<'allowed' | 'excluded'>('allowed');

  const addDomain = () => {
    if (!newDomain.trim()) return;
    if (filterMode === 'allowed') {
      updateBlock(id, {
        allowedDomains: [...nodeData.allowedDomains, newDomain.trim()],
        excludedDomains: [],
      });
    } else {
      updateBlock(id, {
        excludedDomains: [...nodeData.excludedDomains, newDomain.trim()],
        allowedDomains: [],
      });
    }
    setNewDomain('');
  };

  const removeDomain = (domain: string, type: 'allowed' | 'excluded') => {
    if (type === 'allowed') {
      updateBlock(id, { allowedDomains: nodeData.allowedDomains.filter((d) => d !== domain) });
    } else {
      updateBlock(id, { excludedDomains: nodeData.excludedDomains.filter((d) => d !== domain) });
    }
  };

  const domains = filterMode === 'allowed' ? nodeData.allowedDomains : nodeData.excludedDomains;

  return (
    <BaseNode
      id={id}
      title="Web Search"
      icon={<Globe size={18} strokeWidth={2} />}
      color="#3b82f6"
      width={nodeData.size.width}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 bg-[#0f1318] rounded-lg px-3 py-2.5 border border-[#2a3441]">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="text-[13px] text-gray-300 font-medium">grok-4-1-fast (Agentic)</span>
        </div>

        <div>
          <Label>Domain Filter</Label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setFilterMode('allowed')}
              className={cn(
                'flex-1 py-2 px-3 text-[13px] font-medium rounded-lg transition-colors',
                filterMode === 'allowed'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#0f1318] text-gray-400 hover:text-white border border-[#2a3441]'
              )}
            >
              Allow Only
            </button>
            <button
              onClick={() => setFilterMode('excluded')}
              className={cn(
                'flex-1 py-2 px-3 text-[13px] font-medium rounded-lg transition-colors',
                filterMode === 'excluded'
                  ? 'bg-red-500 text-white'
                  : 'bg-[#0f1318] text-gray-400 hover:text-white border border-[#2a3441]'
              )}
            >
              Exclude
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
            placeholder="e.g., wikipedia.org"
            className="flex-1"
          />
          <button
            onClick={addDomain}
            className="h-10 w-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus size={18} strokeWidth={2} />
          </button>
        </div>

        {domains.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {domains.map((domain) => (
              <span
                key={domain}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium',
                  filterMode === 'allowed'
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'bg-red-500/15 text-red-400'
                )}
              >
                {domain}
                <button
                  onClick={() => removeDomain(domain, filterMode)}
                  className="hover:opacity-70"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2.5 cursor-pointer bg-[#0f1318] rounded-lg px-3 py-2.5 border border-[#2a3441] hover:border-gray-500 transition-colors">
          <input
            type="checkbox"
            checked={nodeData.enableImageUnderstanding}
            onChange={(e) => updateBlock(id, { enableImageUnderstanding: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-[13px] text-gray-300 font-medium">Enable Image Understanding</span>
        </label>
      </div>
    </BaseNode>
  );
};

export default memo(WebSearchNode);
