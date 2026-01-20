import React, { memo, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Globe, Plus, X } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
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
      <div className="space-y-4 px-1">
        {/* Max Results */}
        <div>
          <Label className="flex items-center justify-between">
            Max Results
            <span className="text-blue-400 font-semibold">{nodeData.maxResults}</span>
          </Label>
          <div className="bg-[#0f1318] border-2 border-[#3a4451] rounded-xl p-4 mt-1">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={nodeData.maxResults}
              onChange={(e) => updateBlock(id, { maxResults: parseInt(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#3a4451] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
          </div>
        </div>

        {/* Domain Filter */}
        <div>
          <Label>Domain Filter</Label>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setFilterMode('allowed')}
              className={cn(
                'flex-1 py-3 px-4 text-[13px] font-medium rounded-xl transition-colors border-2',
                filterMode === 'allowed'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-[#0f1318] text-gray-400 hover:text-white border-[#3a4451] hover:border-[#4a5568]'
              )}
            >
              Allow Only
            </button>
            <button
              onClick={() => setFilterMode('excluded')}
              className={cn(
                'flex-1 py-3 px-4 text-[13px] font-medium rounded-xl transition-colors border-2',
                filterMode === 'excluded'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-[#0f1318] text-gray-400 hover:text-white border-[#3a4451] hover:border-[#4a5568]'
              )}
            >
              Exclude
            </button>
          </div>
        </div>

        {/* Add Domain */}
        <div className="flex gap-3">
          <input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
            placeholder="e.g., wikipedia.org"
            className="flex-1 bg-[#0f1318] border-2 border-[#3a4451] rounded-xl text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#4a5568] transition-colors"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
          />
          <button
            onClick={addDomain}
            className="h-12 w-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
          >
            <Plus size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Domain Tags */}
        {domains.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <span
                key={domain}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium',
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
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-[#0f1318] rounded-xl p-4 border-2 border-[#3a4451]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
              Input
            </span>
          </div>
          <p className="text-[12px] text-gray-400">
            Connect a TextInput with your search query
          </p>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(WebSearchNode);
