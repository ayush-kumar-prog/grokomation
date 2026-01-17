import React, { memo, useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Globe, Plus, X } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
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
        excludedDomains: []
      });
    } else {
      updateBlock(id, {
        excludedDomains: [...nodeData.excludedDomains, newDomain.trim()],
        allowedDomains: []
      });
    }
    setNewDomain('');
  };

  const removeDomain = (domain: string, type: 'allowed' | 'excluded') => {
    if (type === 'allowed') {
      updateBlock(id, { allowedDomains: nodeData.allowedDomains.filter(d => d !== domain) });
    } else {
      updateBlock(id, { excludedDomains: nodeData.excludedDomains.filter(d => d !== domain) });
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
      <div className="space-y-5">
        <div className="flex items-center gap-3 bg-gray-900/60 rounded-xl px-4 py-3 border border-gray-700/50">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
          <span className="text-[13px] text-gray-300 font-medium">grok-4-1-fast (Agentic)</span>
        </div>

        <div>
          <label className="text-[13px] text-gray-400 mb-3 block font-medium tracking-wide">Domain Filter</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterMode('allowed')}
              className={`flex-1 py-2.5 px-4 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                filterMode === 'allowed'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/80 border border-gray-700/50'
              }`}
            >
              Allow Only
            </button>
            <button
              onClick={() => setFilterMode('excluded')}
              className={`flex-1 py-2.5 px-4 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                filterMode === 'excluded'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/80 border border-gray-700/50'
              }`}
            >
              Exclude
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
            className="flex-1 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-gray-900/80 transition-all duration-200"
            placeholder="e.g., wikipedia.org"
          />
          <button
            onClick={addDomain}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {domains.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <span
                key={domain}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium ${
                  filterMode === 'allowed' ? 'bg-blue-500/15 text-blue-300' : 'bg-red-500/15 text-red-300'
                }`}
              >
                {domain}
                <button onClick={() => removeDomain(domain, filterMode)} className="hover:opacity-70 transition-opacity">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer bg-gray-900/60 rounded-xl px-4 py-3 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
          <input
            type="checkbox"
            checked={nodeData.enableImageUnderstanding}
            onChange={(e) => updateBlock(id, { enableImageUnderstanding: e.target.checked })}
          />
          <span className="text-[13px] text-gray-300 font-medium">Enable Image Understanding</span>
        </label>
      </div>
    </BaseNode>
  );
};

export default memo(WebSearchNode);
