import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { Send, User, AtSign, Bell, Loader2, Play, X, GripHorizontal, Zap } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import type { XDMBlock, XFetchBlock } from '../../types/canvas';
import { llmRouter } from '../../services/llmRouter';

const XLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const XDMNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as XDMBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const removeBlock = useCanvasStore((s) => s.removeBlock);
  const getInputFromConnections = useCanvasStore((s) => s.getInputFromConnections);
  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);
  const nodeOutputs = useCanvasStore((s) => s.nodeOutputs);

  const [recipientName, setRecipientName] = useState(nodeData.recipientName || '');
  const [recipientUsername, setRecipientUsername] = useState(nodeData.recipientUsername || '');
  const [alertTitle, setAlertTitle] = useState(nodeData.alertTitle || 'Alert');
  const [isGenerating, setIsGenerating] = useState(false);
  const hasTriggeredRef = useRef(false);
  const handleGenerateAlertRef = useRef<(() => Promise<void>) | null>(null);

  const connectedInput = getInputFromConnections(id);
  const hasMessage = connectedInput !== null && connectedInput !== undefined;

  const getConnectedXFetch = useCallback(() => {
    const incomingConnections = connections.filter((c) => c.target === id);
    for (const conn of incomingConnections) {
      const sourceBlock = blocks.find((b) => b.id === conn.source);
      if (sourceBlock && sourceBlock.type === 'xFetch') {
        return { block: sourceBlock as XFetchBlock, id: conn.source };
      }
    }
    return null;
  }, [connections, blocks, id]);

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

  const connectedXFetch = getConnectedXFetch();
  const xFetchOutput = connectedXFetch ? nodeOutputs[connectedXFetch.id] as any : null;
  const hasXFetchData = xFetchOutput?.success && xFetchOutput?.tweets?.length > 0;

  const isAlertMode = connectedXFetch?.block?.monitorMode || nodeData.alertMode;
  const shouldTriggerAlert = connectedXFetch?.block?.simulateThresholdHit;

  const handleNameChange = useCallback((value: string) => {
    setRecipientName(value);
    updateBlock(id, { recipientName: value });
  }, [id, updateBlock]);

  const handleUsernameChange = useCallback((value: string) => {
    setRecipientUsername(value);
    updateBlock(id, { recipientUsername: value });
  }, [id, updateBlock]);

  const handleAlertTitleChange = useCallback((value: string) => {
    setAlertTitle(value);
    updateBlock(id, { alertTitle: value });
  }, [id, updateBlock]);

  const isConfigured = recipientName.trim() && recipientUsername.trim();

  const handleGenerateAlert = useCallback(async () => {
    if (!hasXFetchData || !isConfigured) return;

    setIsGenerating(true);
    const phoneId = getConnectedPhone();

    if (phoneId) {
      updateBlock(phoneId, {
        isLoading: true,
        contentType: 'xDM',
        error: undefined,
      });
    }

    try {
      const tweetTexts = xFetchOutput.tweets
        .slice(0, 15)
        .map((t: any, i: number) => `${i + 1}. @${t.authorUsername}: ${t.text}`)
        .join('\n\n');

      const query = xFetchOutput.query || 'trending topic';
      const tweetCount = xFetchOutput.count || xFetchOutput.tweets.length;
      const threshold = connectedXFetch?.block?.threshold || 300;

      const synopsisResponse = await llmRouter.chat({
        messages: [{
          role: 'user',
          content: `You are a social media analyst. Analyze these ${tweetCount} tweets about "${query}" and create a brief, engaging synopsis (2-3 sentences) of what people are talking about. Focus on the main themes, sentiment, and any notable trends.

TWEETS:
${tweetTexts}

Write a concise synopsis that would work as a DM alert notification. Start with an emoji that fits the sentiment. Keep it under 200 characters if possible.`,
        }],
        model: 'grok-4-latest',
        temperature: 0.7,
        maxTokens: 200,
      });

      const synopsis = synopsisResponse.success && synopsisResponse.data
        ? synopsisResponse.data.content
        : `${tweetCount} tweets detected about ${query}. High activity in the last hour.`;

      const now = new Date();
      const alertMessage = `🚨 ${alertTitle || 'ALERT'}: ${query}

${synopsis}

📊 ${tweetCount} tweets detected (threshold: ${threshold}/hr)
⏰ ${now.toLocaleTimeString()}`;

      const dmData = {
        recipientName,
        recipientUsername,
        messages: [
          {
            id: 'alert-' + Date.now(),
            text: alertMessage,
            isOutgoing: true,
            timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'delivered',
          },
        ],
        sentAt: now.toISOString(),
        isAlert: true,
        alertData: {
          query,
          tweetCount,
          threshold,
          synopsis,
        },
      };

      if (phoneId) {
        updateBlock(phoneId, {
          isLoading: false,
          contentType: 'xDM',
          content: JSON.stringify(dmData),
          error: undefined,
        });
      }
    } catch (error) {
      console.error('[XDMNode] Error generating alert:', error);
      const phoneId = getConnectedPhone();
      if (phoneId) {
        updateBlock(phoneId, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to generate alert',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [hasXFetchData, isConfigured, xFetchOutput, connectedXFetch, recipientName, recipientUsername, alertTitle, getConnectedPhone, updateBlock]);

  // Keep the ref updated with latest handleGenerateAlert
  handleGenerateAlertRef.current = handleGenerateAlert;

  // Reset trigger ref when simulate alert is turned off
  useEffect(() => {
    if (!shouldTriggerAlert) {
      hasTriggeredRef.current = false;
    }
  }, [shouldTriggerAlert]);

  // Auto-trigger alert when conditions are met - only fires once per toggle
  useEffect(() => {
    if (shouldTriggerAlert && hasXFetchData && isConfigured && !isGenerating && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      const timer = setTimeout(() => {
        handleGenerateAlertRef.current?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldTriggerAlert, hasXFetchData, isConfigured, isGenerating]); // Removed handleGenerateAlert from deps

  const getStatusText = () => {
    if (isGenerating) return 'GENERATING...';
    if (isAlertMode) {
      if (!isConfigured) return 'CONFIGURE RECIPIENT';
      if (!hasXFetchData) return 'WAITING FOR DATA';
      if (shouldTriggerAlert) return 'ALERT TRIGGERED';
      return 'READY';
    }
    if (!recipientName.trim()) return 'ENTER NAME';
    if (!recipientUsername.trim()) return 'ENTER USERNAME';
    if (!hasMessage) return 'CONNECT INPUT';
    return 'READY';
  };

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
              {isAlertMode ? 'X DM ALERT' : 'X DM'}
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
          {/* Status */}
          <div style={{
            marginBottom: '16px',
            padding: '10px 12px',
            background: shouldTriggerAlert && hasXFetchData ? '#fef2f2' : '#f5f5f5',
            border: shouldTriggerAlert && hasXFetchData ? '2px solid #000000' : '2px solid #000000',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              background: isGenerating ? '#3b82f6' :
                         shouldTriggerAlert && hasXFetchData ? '#ef4444' :
                         isConfigured && (hasMessage || hasXFetchData) ? '#22c55e' :
                         isConfigured ? '#eab308' : '#9ca3af',
            }} />
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#000000',
              letterSpacing: '0.5px',
            }}>
              {getStatusText()}
            </span>
          </div>

          {/* Alert Mode Indicator */}
          {isAlertMode && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 12px',
              background: '#fffbeb',
              border: '2px solid #000000',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Bell size={14} style={{ color: '#000000' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#000000', letterSpacing: '0.5px' }}>
                ALERT MODE ACTIVE
              </span>
            </div>
          )}

          {/* Alert Title (for alert mode) */}
          {isAlertMode && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 700,
                color: '#000000',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}>
                ALERT TITLE
              </label>
              <div style={{ position: 'relative' }}>
                <Zap
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
                  value={alertTitle}
                  onChange={(e) => handleAlertTitleChange(e.target.value)}
                  placeholder="Tesla Alert"
                  className="nodrag"
                  style={{
                    width: '100%',
                    border: '2px solid #000000',
                    padding: '10px 12px 10px 36px',
                    fontSize: '12px',
                    color: '#000000',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Recipient Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: 700,
              color: '#000000',
              marginBottom: '8px',
              letterSpacing: '0.5px',
            }}>
              RECIPIENT NAME
            </label>
            <div style={{ position: 'relative' }}>
              <User
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
                value={recipientName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Elon Musk"
                className="nodrag"
                style={{
                  width: '100%',
                  border: '2px solid #000000',
                  padding: '10px 12px 10px 36px',
                  fontSize: '12px',
                  color: '#000000',
                  background: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Recipient Username */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: 700,
              color: '#000000',
              marginBottom: '8px',
              letterSpacing: '0.5px',
            }}>
              USERNAME
            </label>
            <div style={{ position: 'relative' }}>
              <AtSign
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
                value={recipientUsername}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="elonmusk"
                className="nodrag"
                style={{
                  width: '100%',
                  border: '2px solid #000000',
                  padding: '10px 12px 10px 36px',
                  fontSize: '12px',
                  color: '#000000',
                  background: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Tweet Data Preview (Alert Mode) */}
          {isAlertMode && hasXFetchData && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#f5f5f5',
              border: '2px solid #000000',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#000000' }}>
                  DATA RECEIVED
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: '#000000',
                  padding: '2px 8px',
                }}>
                  {xFetchOutput.count} POSTS
                </span>
              </div>
              <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>
                Query: "{xFetchOutput.query}"
              </p>
            </div>
          )}

          {/* Manual Send Button (Alert Mode) */}
          {isAlertMode && hasXFetchData && isConfigured && !shouldTriggerAlert && (
            <button
              onClick={handleGenerateAlert}
              disabled={isGenerating}
              className="nodrag"
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                background: isGenerating ? '#3b82f6' : '#000000',
                color: '#ffffff',
                border: '2px solid #000000',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  GENERATING...
                </>
              ) : (
                <>
                  <Play size={14} />
                  SEND ALERT NOW
                </>
              )}
            </button>
          )}

          {/* Message Preview (Original DM Mode) */}
          {!isAlertMode && hasMessage && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 700,
                color: '#000000',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}>
                MESSAGE
              </label>
              <div style={{
                padding: '10px 12px',
                background: '#f5f5f5',
                border: '2px solid #000000',
                maxHeight: '80px',
                overflow: 'auto',
              }}>
                <p style={{
                  fontSize: '11px',
                  color: '#000000',
                  margin: 0,
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                }}>
                  {String(connectedInput).slice(0, 280)}
                  {String(connectedInput).length > 280 && '...'}
                </p>
              </div>
              <p style={{
                fontSize: '9px',
                color: '#666666',
                marginTop: '4px',
                fontWeight: 600,
              }}>
                {String(connectedInput).length}/280 CHARS
              </p>
            </div>
          )}

          {/* DM Preview Card */}
          {isConfigured && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#ffffff',
              border: '2px solid #000000',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#000000',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                }}>
                  {recipientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#000000', margin: 0 }}>
                    {recipientName}
                  </p>
                  <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>
                    @{recipientUsername}
                  </p>
                </div>
              </div>

              {!isAlertMode && hasMessage && (
                <div style={{
                  background: '#000000',
                  color: '#ffffff',
                  padding: '10px 12px',
                  marginLeft: 'auto',
                  maxWidth: '80%',
                }}>
                  <p style={{ fontSize: '10px', margin: 0, lineHeight: 1.4 }}>
                    {String(connectedInput).slice(0, 100)}
                    {String(connectedInput).length > 100 && '...'}
                  </p>
                </div>
              )}

              {isAlertMode && hasXFetchData && (
                <div style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  padding: '10px 12px',
                  marginLeft: 'auto',
                  maxWidth: '80%',
                }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, margin: 0 }}>
                    🚨 {alertTitle}
                  </p>
                  <p style={{ fontSize: '9px', margin: '4px 0 0 0', opacity: 0.9 }}>
                    {xFetchOutput.count} posts about "{xFetchOutput.query}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Connection Hint */}
          <div style={{
            padding: '10px 12px',
            border: '2px dashed #cccccc',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Send size={12} style={{ color: '#999999' }} />
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#999999' }}>
              {isAlertMode ? 'CONNECT TO PHONE FOR OUTPUT' : 'SIMULATED - CONNECT TO PHONE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(XDMNode);
