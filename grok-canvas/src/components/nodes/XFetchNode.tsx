import React, { memo, useState, useCallback, useEffect } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { Search, Play, Loader2, X, GripHorizontal, Bell, Zap } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
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
  const removeBlock = useCanvasStore((s) => s.removeBlock);
  const setNodeOutput = useCanvasStore((s) => s.setNodeOutput);
  const setNodeExecutionStatus = useCanvasStore((s) => s.setNodeExecutionStatus);
  const nodeExecutionStates = useCanvasStore((s) => s.nodeExecutionStates);
  const nodeOutputs = useCanvasStore((s) => s.nodeOutputs);
  const getInputFromConnections = useCanvasStore((s) => s.getInputFromConnections);
  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);

  const [query, setQuery] = useState(nodeData.query || '');

  const status = nodeExecutionStates[id]?.status || 'idle';
  const output = nodeOutputs[id] as any;

  const connectedInput = getInputFromConnections(id);
  const effectiveQuery = typeof connectedInput === 'string' ? connectedInput : query;

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

  const [lastSentOutputId, setLastSentOutputId] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (output && output.success && output.tweets && Array.isArray(output.tweets)) {
        const outputId = `${output.query}-${output.count}-${output.metadata?.searchedAt || ''}`;

        if (outputId === lastSentOutputId) {
          return;
        }

        const phoneId = getConnectedPhone();
        if (phoneId) {
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
      if (phoneId) {
        updateBlock(phoneId, {
          isLoading: false,
          error: errorMsg,
        });
      }
    }
  }, [effectiveQuery, nodeData.count, id, setNodeExecutionStatus, setNodeOutput, getConnectedPhone, updateBlock]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    updateBlock(id, { query: value });
  }, [id, updateBlock]);

  return (
    <div
      className="relative"
      style={{ width: nodeData.size?.width || 320 }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          width: '12px',
          height: '12px',
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 0,
          top: -6,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          width: '12px',
          height: '12px',
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 0,
          left: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          width: '12px',
          height: '12px',
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 0,
          right: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          width: '12px',
          height: '12px',
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 0,
          bottom: -6,
        }}
      />

      {/* Main Container */}
      <div style={{ background: '#ffffff', border: '3px solid #000000' }}>
        {/* Header */}
        <div
          style={{
            background: '#000000',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <XLogo size={16} className="text-white" />
            <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
              X SEARCH
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <div
              className="drag-handle"
              style={{
                cursor: 'grab',
                padding: '6px',
                color: '#ffffff',
              }}
            >
              <GripHorizontal size={14} />
            </div>
            <button
              onClick={() => removeBlock(id)}
              style={{
                padding: '6px',
                color: '#ffffff',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Search Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: 700,
              color: '#000000',
              marginBottom: '8px',
              letterSpacing: '0.5px',
            }}>
              QUERY
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999999',
                }}
              />
              <input
                type="text"
                value={connectedInput ? String(connectedInput) : query}
                onChange={(e) => handleQueryChange(e.target.value)}
                disabled={!!connectedInput}
                placeholder="#tesla OR @elonmusk"
                className="nodrag"
                style={{
                  width: '100%',
                  border: '2px solid #000000',
                  padding: '10px 12px 10px 36px',
                  fontSize: '12px',
                  color: '#000000',
                  background: connectedInput ? '#f5f5f5' : '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
            {connectedInput !== null && connectedInput !== undefined && (
              <p style={{ fontSize: '10px', fontWeight: 600, color: '#666666', marginTop: '6px' }}>
                USING CONNECTED INPUT
              </p>
            )}
          </div>

          {/* Results Count */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <label style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#000000',
                letterSpacing: '0.5px',
              }}>
                COUNT
              </label>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#000000',
              }}>
                {nodeData.count || 10}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="10"
              value={nodeData.count || 10}
              onChange={(e) => updateBlock(id, { count: parseInt(e.target.value) })}
              className="nodrag"
              style={{
                width: '100%',
                height: '4px',
                background: '#000000',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
            />
          </div>

          {/* Monitor Mode - Only show when connected to XDM */}
          {connectedXDM && (
            <div style={{
              marginBottom: '16px',
              border: '2px solid #000000',
              background: '#fffbeb',
            }}>
              <div style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={14} style={{ color: '#000000' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#000000', letterSpacing: '0.5px' }}>
                    MONITOR MODE
                  </span>
                </div>
                <button
                  onClick={() => updateBlock(id, { monitorMode: !nodeData.monitorMode })}
                  className="nodrag"
                  style={{
                    width: '40px',
                    height: '20px',
                    border: '2px solid #000000',
                    background: nodeData.monitorMode ? '#22c55e' : '#d1d5db',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      background: '#ffffff',
                      border: '1px solid #000000',
                      position: 'absolute',
                      top: '1px',
                      left: nodeData.monitorMode ? '22px' : '1px',
                      transition: 'left 0.15s ease',
                    }}
                  />
                </button>
              </div>

              {nodeData.monitorMode && (
                <div style={{ padding: '0 12px 12px 12px' }}>
                  {/* Threshold Setting */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}>
                      <label style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: '#000000',
                        letterSpacing: '0.5px',
                      }}>
                        ALERT THRESHOLD
                      </label>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#000000' }}>
                        {nodeData.threshold || 300}/HR
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="50"
                      value={nodeData.threshold || 300}
                      onChange={(e) => updateBlock(id, { threshold: parseInt(e.target.value) })}
                      className="nodrag"
                      style={{
                        width: '100%',
                        height: '4px',
                        background: '#000000',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                      }}
                    />
                  </div>

                  {/* Simulate Alert Toggle */}
                  <div style={{
                    padding: '10px',
                    background: '#ffffff',
                    border: '2px dashed #000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={12} style={{ color: '#ca8a04' }} />
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#000000' }}>
                        SIMULATE ALERT
                      </span>
                    </div>
                    <button
                      onClick={() => updateBlock(id, { simulateThresholdHit: !nodeData.simulateThresholdHit })}
                      className="nodrag"
                      style={{
                        width: '32px',
                        height: '16px',
                        border: '2px solid #000000',
                        background: nodeData.simulateThresholdHit ? '#facc15' : '#e5e7eb',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          background: '#ffffff',
                          border: '1px solid #000000',
                          position: 'absolute',
                          top: '1px',
                          left: nodeData.simulateThresholdHit ? '17px' : '1px',
                          transition: 'left 0.15s ease',
                        }}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div style={{
                padding: '8px 12px',
                borderTop: '1px solid #e5e7eb',
              }}>
                <p style={{ fontSize: '9px', color: '#666666', margin: 0 }}>
                  Connected to X DM - sends alert when threshold hit
                </p>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={!effectiveQuery.trim() || status === 'running'}
            className="nodrag"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              background: !effectiveQuery.trim() || status === 'running' ? '#cccccc' : '#000000',
              color: !effectiveQuery.trim() || status === 'running' ? '#666666' : '#ffffff',
              border: '2px solid #000000',
              cursor: !effectiveQuery.trim() || status === 'running' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {status === 'running' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                SEARCHING...
              </>
            ) : (
              <>
                <Play size={14} />
                SEARCH
              </>
            )}
          </button>

          {/* Status/Results */}
          {status === 'success' && output?.count > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '10px 12px',
              background: '#f5f5f5',
              border: '1px solid #e5e5e5',
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#666666',
              }}>
                Found {output.count} posts
              </span>
            </div>
          )}

          {status === 'error' && (
            <div style={{
              marginTop: '12px',
              padding: '10px 12px',
              background: '#fff5f5',
              border: '1px solid #ffcccc',
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#cc0000',
              }}>
                {nodeExecutionStates[id]?.error || 'Search failed'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(XFetchNode);
