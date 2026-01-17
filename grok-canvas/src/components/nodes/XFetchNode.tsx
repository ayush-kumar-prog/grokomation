import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Search, User, AtSign, TrendingUp } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import type { XFetchBlock } from '../../types/canvas';

const XLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const fetchTypes = [
  { id: 'search', label: 'Search', icon: Search, description: 'Search tweets by query' },
  { id: 'user_timeline', label: 'User', icon: User, description: 'Get user timeline' },
  { id: 'mentions', label: 'Mentions', icon: AtSign, description: 'Fetch mentions' },
  { id: 'trending', label: 'Trending', icon: TrendingUp, description: 'Trending topics' },
] as const;

const XFetchNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as XFetchBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  return (
    <BaseNode
      id={id}
      title="X Fetch"
      icon={<XLogo size={18} />}
      color="#18181b"
      width={nodeData.size.width}
    >
      <div className="space-y-4 px-1">
        {/* Fetch Type Selection */}
        <div>
          <Label>Fetch Type</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {fetchTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = nodeData.fetchType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => updateBlock(id, { fetchType: type.id })}
                  className={cn(
                    'flex flex-col items-center gap-2 py-3 px-3 rounded-xl transition-colors border-2',
                    isSelected
                      ? 'bg-white text-black border-white'
                      : 'bg-[#0f1318] text-gray-400 hover:text-white border-[#3a4451] hover:border-[#4a5568]'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-[12px] font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Count */}
        <div>
          <Label className="flex items-center justify-between">
            Results Count
            <span className="text-gray-400 font-semibold">{nodeData.count}</span>
          </Label>
          <div className="bg-[#0f1318] border-2 border-[#3a4451] rounded-xl p-4 mt-1">
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={nodeData.count}
              onChange={(e) => updateBlock(id, { count: parseInt(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#3a4451] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
        </div>

        {/* Include Replies Toggle */}
        <label className="flex items-center gap-3 cursor-pointer bg-[#0f1318] rounded-xl px-4 py-3 border-2 border-[#3a4451] hover:border-[#4a5568] transition-colors">
          <input
            type="checkbox"
            checked={nodeData.includeReplies}
            onChange={(e) => updateBlock(id, { includeReplies: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-[13px] text-gray-300 font-medium">Include Replies</span>
        </label>

        {/* Info Box */}
        <div className="bg-[#0f1318] rounded-xl p-4 border-2 border-[#3a4451]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
              Input
            </span>
          </div>
          <p className="text-[12px] text-gray-400">
            {nodeData.fetchType === 'search' && 'Connect a TextInput with your search query'}
            {nodeData.fetchType === 'user_timeline' && 'Connect a TextInput with @username'}
            {nodeData.fetchType === 'mentions' && 'No input needed - fetches your mentions'}
            {nodeData.fetchType === 'trending' && 'No input needed - fetches trending topics'}
          </p>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(XFetchNode);
