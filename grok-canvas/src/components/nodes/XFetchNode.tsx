import React, { memo, useState, useCallback, useEffect } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Search, Play, Copy, Check, Loader2, Bell, Zap } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { cn } from '@/lib/utils';
import type { XFetchBlock, XDMBlock } from '../../types/canvas';
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
  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);

  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState(nodeData.query || '');

  const status = nodeExecutionStates[id]?.status || 'idle';
  const output = nodeOutputs[id] as any;

  // Get query from connected input or local state
  const connectedInput = getInputFromConnections(id);
  const effectiveQuery = typeof connectedInput === 'string' ? connectedInput : query;

  // Find connected phone node
  const getConnectedPhone = useCallback(() => {
    const outgoingConnections = connections.filter((c) => c.source === id);
    for (const conn of outgoingConnections) {
      const targetBlock = blocks.find((b) => b.id === conn.target);
      if (targetBlock && targetBlock.type === 'phone') {
        return targetBlock.id;
      }
    }
    return null;
  }, [connections, blocks, id]);

  // Find connected XDM node (for chained workflow)
  const getConnectedXDM = useCallback(() => {
    const outgoingConnections = connections.filter((c) => c.source === id);
    for (const conn of outgoingConnections) {
      const targetBlock = blocks.find((b) => b.id === conn.target);
      if (targetBlock && targetBlock.type === 'xDM') {
        return targetBlock as XDMBlock;
      }
    }
    return null;
  }, [connections, blocks, id]);

  const connectedXDM = getConnectedXDM();

  // Track if we've already sent this output to prevent loops
  const [lastSentOutputId, setLastSentOutputId] = useState<string | null>(null);

  // Update connected phone when output changes
  useEffect(() => {
    try {
      if (output && output.success && output.tweets && Array.isArray(output.tweets)) {
        // Create a unique ID for this output to prevent duplicate sends
        const outputId = `${output.query}-${output.count}-${output.metadata?.searchedAt || ''}`;

        // Skip if we already sent this exact output
        if (outputId === lastSentOutputId) {
          return;
        }

        const phoneId = getConnectedPhone();
        if (phoneId) {
          console.log('[XFetchNode] Sending results to phone:', phoneId);

          // Format data for phone display with defensive defaults
          const phoneData = {
            query: output.query || '',
            count: output.count || 0,
            tweets: output.tweets.map((t: any) => ({
              id: t.id || String(Math.random()),
              text: t.text || '',
              author: t.author || 'Unknown',
              username: t.authorUsername || 'unknown',
              createdAt: t.createdAt || new Date().toISOString(),
              likes: t.likes || 0,
              retweets: t.retweets || 0,
              replies: t.replies || 0,
            })),
            searchedAt: output.metadata?.searchedAt || new Date().toISOString(),
          };

          console.log('[XFetchNode] Phone data:', phoneData);

          updateBlock(phoneId, {
            contentType: 'xFetch',
            content: JSON.stringify(phoneData),
            isLoading: false,
            error: undefined,
          });

          setLastSentOutputId(outputId);
        }
      }
    } catch (err) {
      console.error('[XFetchNode] Error updating phone:', err);
    }
  }, [output, getConnectedPhone, updateBlock, lastSentOutputId]);

  const handleExecute = useCallback(async () => {
    if (!effectiveQuery.trim()) return;

    setNodeExecutionStatus(id, 'running');

    // Set connected phone to loading state
    const phoneId = getConnectedPhone();
    if (phoneId) {
      updateBlock(phoneId, {
        isLoading: true,
        contentType: 'xFetch',
        error: undefined,
      });
    }

    try {
      const result = await searchTweets(effectiveQuery, {
        maxResults: nodeData.count || 10,
      });

      if (result.success) {
        setNodeOutput(id, result);
      } else {
        setNodeExecutionStatus(id, 'error', result.error);
        // Update phone with error
        if (phoneId) {
          updateBlock(phoneId, {
            isLoading: false,
            error: result.error,
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Search failed';
      setNodeExecutionStatus(id, 'error', errorMsg);
      // Update phone with error
      if (phoneId) {
        updateBlock(phoneId, {
          isLoading: false,
          error: errorMsg,
        });
      }
    }
  }, [effectiveQuery, nodeData.count, id, setNodeExecutionStatus, setNodeOutput, getConnectedPhone, updateBlock]);

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
      <div className="space-y-5 p-2">
        {/* Status */}
        <div className="flex items-center gap-4 p-4 border-2 border-black bg-gray-100">
          <div className={cn('w-3 h-3', getStatusBg())} />
          <span className="text-xs font-bold uppercase tracking-wide text-black">
            {getStatusText()}
          </span>
        </div>

        {/* Search Query Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-black mb-3">
            SEARCH QUERY
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={connectedInput ? String(connectedInput) : query}
              onChange={(e) => handleQueryChange(e.target.value)}
              disabled={!!connectedInput}
              placeholder="#tesla OR @elonmusk"
              className={cn(
                'w-full border-2 border-black pl-12 pr-4 py-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black nodrag bg-white',
                connectedInput && 'bg-gray-100'
              )}
            />
          </div>
          {connectedInput && (
            <p className="text-xs font-bold text-blue-600 mt-2 uppercase">USING CONNECTED INPUT</p>
          )}
        </div>

        {/* Results Count */}
        <div>
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-black mb-3">
            RESULTS COUNT
            <span className="text-black text-sm">{nodeData.count || 10}</span>
          </label>
          <div className="border-2 border-black p-5 bg-gray-100">
            <input
              type="range"
              min="10"
              max="50"
              step="10"
              value={nodeData.count || 10}
              onChange={(e) => updateBlock(id, { count: parseInt(e.target.value) })}
              className="w-full h-2 appearance-none cursor-pointer bg-black [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black nodrag"
            />
          </div>
        </div>

        {/* Monitor Mode Toggle */}
        {connectedXDM && (
          <div className="border-2 border-black p-4 bg-yellow-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-black" />
                <label className="text-xs font-bold uppercase tracking-wide text-black">
                  MONITOR MODE
                </label>
              </div>
              <button
                onClick={() => updateBlock(id, { monitorMode: !nodeData.monitorMode })}
                className={cn(
                  'w-12 h-6 rounded-none border-2 border-black transition-colors relative',
                  nodeData.monitorMode ? 'bg-green-500' : 'bg-gray-300'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 bg-white border border-black absolute top-0.5 transition-all',
                    nodeData.monitorMode ? 'left-6' : 'left-0.5'
                  )}
                />
              </button>
            </div>

            {nodeData.monitorMode && (
              <>
                {/* Threshold Setting */}
                <div className="mb-3">
                  <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-black mb-2">
                    ALERT THRESHOLD
                    <span className="text-black">{nodeData.threshold || 300} TWEETS/HR</span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={nodeData.threshold || 300}
                    onChange={(e) => updateBlock(id, { threshold: parseInt(e.target.value) })}
                    className="w-full h-2 appearance-none cursor-pointer bg-black [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black nodrag"
                  />
                </div>

                {/* Simulate Threshold Hit Toggle */}
                <div className="flex items-center justify-between p-3 bg-white border-2 border-dashed border-black">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-yellow-600" />
                    <span className="text-xs font-bold uppercase text-black">
                      SIMULATE ALERT (DEMO)
                    </span>
                  </div>
                  <button
                    onClick={() => updateBlock(id, { simulateThresholdHit: !nodeData.simulateThresholdHit })}
                    className={cn(
                      'w-10 h-5 rounded-none border-2 border-black transition-colors relative',
                      nodeData.simulateThresholdHit ? 'bg-yellow-400' : 'bg-gray-200'
                    )}
                  >
                    <div
                      className={cn(
                        'w-3 h-3 bg-white border border-black absolute top-0.5 transition-all',
                        nodeData.simulateThresholdHit ? 'left-5' : 'left-0.5'
                      )}
                    />
                  </button>
                </div>
              </>
            )}

            <p className="text-xs text-gray-600 mt-3">
              Connected to X DM node - will send alert when threshold is hit
            </p>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={!effectiveQuery.trim() || status === 'running'}
          className={cn(
            'w-full py-4 font-bold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-3 border-2',
            status === 'running'
              ? 'bg-blue-500 text-white border-blue-500'
              : effectiveQuery.trim()
                ? 'bg-black text-white border-black hover:bg-white hover:text-black'
                : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
          )}
        >
          {status === 'running' ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              SEARCHING...
            </>
          ) : (
            <>
              <Play size={18} />
              SEARCH X
            </>
          )}
        </button>

        {/* Output Preview */}
        {output && output.tweets && output.tweets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wide text-black">
                RESULTS ({output.count} TWEETS)
              </label>
              <button
                onClick={handleCopy}
                className="text-black hover:text-gray-600 transition-colors p-1"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>
            <div className="nodrag nowheel border-2 border-black p-4 max-h-[200px] overflow-auto bg-gray-50">
              {output.tweets.slice(0, 3).map((tweet: any, i: number) => (
                <div key={tweet.id || i} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b-2 last:border-b-0 border-gray-200">
                  <p className="text-xs text-gray-500 font-bold mb-2">@{tweet.authorUsername}</p>
                  <p className="text-xs text-black select-text cursor-text leading-relaxed">
                    {tweet.text?.slice(0, 120)}{tweet.text?.length > 120 ? '...' : ''}
                  </p>
                </div>
              ))}
              {output.tweets.length > 3 && (
                <p className="text-xs text-gray-500 text-center mt-3 font-bold">
                  +{output.tweets.length - 3} MORE TWEETS
                </p>
              )}
            </div>
          </div>
        )}

        {/* No results message */}
        {output && output.tweets && output.tweets.length === 0 && (
          <div className="border-2 border-yellow-500 bg-yellow-50 p-4">
            <p className="text-xs text-yellow-700 font-bold uppercase">
              NO TWEETS FOUND. TRY: elonmusk, #AI, from:Tesla
            </p>
          </div>
        )}

        {/* Search tips */}
        {!output && (
          <div className="text-xs text-gray-600 border-2 border-gray-300 p-4 bg-gray-50">
            <p className="font-bold text-black mb-2 uppercase">SEARCH TIPS:</p>
            <p className="mb-1">elonmusk - keyword search</p>
            <p className="mb-1">from:elonmusk - tweets from user</p>
            <p>#AI - hashtag search</p>
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default memo(XFetchNode);
