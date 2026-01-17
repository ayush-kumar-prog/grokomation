import React, { memo, useState, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Search, Play, Copy, Check, Loader2 } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { cn } from '@/lib/utils';
import type { XFetchBlock } from '../../types/canvas';
import { searchTweets } from '../../api/twitter';

const XLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const XFetchNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as XFetchBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const setNodeOutput = useCanvasStore((s) => s.setNodeOutput);
  const setNodeExecutionStatus = useCanvasStore((s) => s.setNodeExecutionStatus);
  const nodeExecutionStates = useCanvasStore((s) => s.nodeExecutionStates);
  const nodeOutputs = useCanvasStore((s) => s.nodeOutputs);
  const getInputFromConnections = useCanvasStore((s) => s.getInputFromConnections);

  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState(nodeData.query || '');

  const status = nodeExecutionStates[id]?.status || 'idle';
  const output = nodeOutputs[id] as any;

  // Get query from connected input or local state
  const connectedInput = getInputFromConnections(id);
  const effectiveQuery = typeof connectedInput === 'string' ? connectedInput : query;

  const handleExecute = useCallback(async () => {
    if (!effectiveQuery.trim()) return;

    setNodeExecutionStatus(id, 'running');

    try {
      const result = await searchTweets(effectiveQuery, {
        maxResults: nodeData.count || 10,
      });

      if (result.success) {
        setNodeOutput(id, result);
      } else {
        setNodeExecutionStatus(id, 'error', result.error);
      }
    } catch (error) {
      setNodeExecutionStatus(id, 'error', error instanceof Error ? error.message : 'Search failed');
    }
  }, [effectiveQuery, nodeData.count, id, setNodeExecutionStatus, setNodeOutput]);

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(JSON.stringify(output, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    updateBlock(id, { query: value });
  }, [id, updateBlock]);

  const getStatusText = () => {
    switch (status) {
      case 'running': return 'SEARCHING X...';
      case 'success': return `FOUND ${output?.count || 0} TWEETS`;
      case 'error': return nodeExecutionStates[id]?.error || 'ERROR';
      default: return effectiveQuery ? 'READY TO SEARCH' : 'ENTER A SEARCH QUERY';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return effectiveQuery ? 'bg-green-500' : 'bg-gray-400';
    }
  };

  return (
    <BaseNode
      id={id}
      title="X SEARCH"
      icon={<XLogo size={18} />}
      color="#000000"
      width={nodeData.size?.width || 380}
    >
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3 p-3 border-2 border-black bg-gray-100">
          <div className={cn('w-3 h-3', getStatusBg())} />
          <span className="text-xs font-bold uppercase tracking-wide text-black">
            {getStatusText()}
          </span>
        </div>

        {/* Search Query Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-black mb-2">
            SEARCH QUERY
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={connectedInput ? String(connectedInput) : query}
              onChange={(e) => handleQueryChange(e.target.value)}
              disabled={!!connectedInput}
              placeholder="#tesla OR @elonmusk"
              className={cn(
                'w-full border-2 border-black pl-10 pr-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black nodrag bg-white',
                connectedInput && 'bg-gray-100'
              )}
            />
          </div>
          {connectedInput && (
            <p className="text-xs font-bold text-blue-600 mt-1 uppercase">USING CONNECTED INPUT</p>
          )}
        </div>

        {/* Results Count */}
        <div>
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-black mb-2">
            RESULTS COUNT
            <span className="text-black">{nodeData.count || 10}</span>
          </label>
          <div className="border-2 border-black p-4 bg-gray-100">
            <input
              type="range"
              min="10"
              max="50"
              step="10"
              value={nodeData.count || 10}
              onChange={(e) => updateBlock(id, { count: parseInt(e.target.value) })}
              className="w-full h-2 appearance-none cursor-pointer bg-black [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black nodrag"
            />
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={!effectiveQuery.trim() || status === 'running'}
          className={cn(
            'w-full py-3 font-bold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 border-2',
            status === 'running'
              ? 'bg-blue-500 text-white border-blue-500'
              : effectiveQuery.trim()
                ? 'bg-black text-white border-black hover:bg-white hover:text-black'
                : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
          )}
        >
          {status === 'running' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              SEARCHING...
            </>
          ) : (
            <>
              <Play size={16} />
              SEARCH X
            </>
          )}
        </button>

        {/* Output Preview */}
        {output && output.tweets && output.tweets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wide text-black">
                RESULTS ({output.count} TWEETS)
              </label>
              <button
                onClick={handleCopy}
                className="text-black hover:text-gray-600 transition-colors"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="nodrag nowheel border-2 border-black p-3 max-h-[200px] overflow-auto bg-gray-50">
              {output.tweets.slice(0, 3).map((tweet: any, i: number) => (
                <div key={tweet.id || i} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b-2 last:border-b-0 border-gray-200">
                  <p className="text-xs text-gray-500 font-bold mb-1">@{tweet.authorUsername}</p>
                  <p className="text-xs text-black select-text cursor-text">
                    {tweet.text?.slice(0, 120)}{tweet.text?.length > 120 ? '...' : ''}
                  </p>
                </div>
              ))}
              {output.tweets.length > 3 && (
                <p className="text-xs text-gray-500 text-center mt-2 font-bold">
                  +{output.tweets.length - 3} MORE TWEETS
                </p>
              )}
            </div>
          </div>
        )}

        {/* No results message */}
        {output && output.tweets && output.tweets.length === 0 && (
          <div className="border-2 border-yellow-500 bg-yellow-50 p-3">
            <p className="text-xs text-yellow-700 font-bold uppercase">
              NO TWEETS FOUND. TRY: elonmusk, #AI, from:Tesla
            </p>
          </div>
        )}

        {/* Search tips */}
        {!output && (
          <div className="text-xs text-gray-600 border-2 border-gray-300 p-3 bg-gray-50">
            <p className="font-bold text-black mb-1 uppercase">SEARCH TIPS:</p>
            <p>elonmusk - keyword search</p>
            <p>from:elonmusk - tweets from user</p>
            <p>#AI - hashtag search</p>
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default memo(XFetchNode);
