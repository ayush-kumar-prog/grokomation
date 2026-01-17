import React, { memo, useState, useCallback, useEffect } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Send, User, AtSign, Bell, Loader2, Play } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { cn } from '@/lib/utils';
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
  const getInputFromConnections = useCanvasStore((s) => s.getInputFromConnections);
  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);
  const nodeOutputs = useCanvasStore((s) => s.nodeOutputs);

  const [recipientName, setRecipientName] = useState(nodeData.recipientName || '');
  const [recipientUsername, setRecipientUsername] = useState(nodeData.recipientUsername || '');
  const [alertTitle, setAlertTitle] = useState(nodeData.alertTitle || 'Alert');
  const [isGenerating, setIsGenerating] = useState(false);

  // Get message from connected input (for manual DM mode)
  const connectedInput = getInputFromConnections(id);
  const hasMessage = !!connectedInput;

  // Find connected X Fetch node (for alert mode)
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

  // Find connected Phone node (for output)
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

  // Check if we're in alert mode (connected to XFetch with monitor mode)
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

  // Generate synopsis and send DM alert
  const handleGenerateAlert = useCallback(async () => {
    if (!hasXFetchData || !isConfigured) return;

    setIsGenerating(true);
    const phoneId = getConnectedPhone();

    // Set phone to loading
    if (phoneId) {
      updateBlock(phoneId, {
        isLoading: true,
        contentType: 'xDM',
        error: undefined,
      });
    }

    try {
      // Extract tweet texts for synopsis
      const tweetTexts = xFetchOutput.tweets
        .slice(0, 15)
        .map((t: any, i: number) => `${i + 1}. @${t.authorUsername}: ${t.text}`)
        .join('\n\n');

      const query = xFetchOutput.query || 'trending topic';
      const tweetCount = xFetchOutput.count || xFetchOutput.tweets.length;
      const threshold = connectedXFetch?.block?.threshold || 300;

      // Generate synopsis using Grok
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

      // Create the DM alert message
      const now = new Date();
      const alertMessage = `🚨 ${alertTitle || 'ALERT'}: ${query}

${synopsis}

📊 ${tweetCount} tweets detected (threshold: ${threshold}/hr)
⏰ ${now.toLocaleTimeString()}`;

      // Format for phone display
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

      // Update phone with DM
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

  // Auto-trigger when simulate is enabled and we have data
  useEffect(() => {
    if (shouldTriggerAlert && hasXFetchData && isConfigured && !isGenerating) {
      // Small delay to let the UI update
      const timer = setTimeout(() => {
        handleGenerateAlert();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldTriggerAlert, hasXFetchData, isConfigured, isGenerating, handleGenerateAlert]);

  const getStatusText = () => {
    if (isGenerating) return 'GENERATING ALERT...';
    if (isAlertMode) {
      if (!isConfigured) return 'CONFIGURE RECIPIENT';
      if (!hasXFetchData) return 'WAITING FOR TWEETS...';
      if (shouldTriggerAlert) return '🚨 ALERT TRIGGERED!';
      return 'READY - WAITING FOR TRIGGER';
    }
    // Original DM mode
    if (!recipientName.trim()) return 'ENTER RECIPIENT NAME';
    if (!recipientUsername.trim()) return 'ENTER RECIPIENT USERNAME';
    if (!hasMessage) return 'CONNECT MESSAGE INPUT';
    return 'READY TO SEND DM';
  };

  const getStatusBg = () => {
    if (isGenerating) return 'bg-blue-500';
    if (isAlertMode) {
      if (shouldTriggerAlert && hasXFetchData) return 'bg-red-500';
      if (isConfigured && hasXFetchData) return 'bg-yellow-500';
      return 'bg-gray-400';
    }
    if (isConfigured && hasMessage) return 'bg-green-500';
    if (isConfigured) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <BaseNode
      id={id}
      title={isAlertMode ? "X DM ALERT" : "X DM"}
      icon={<XLogo size={18} />}
      color="#000000"
      width={nodeData.size?.width || 320}
    >
      <div className="space-y-4">
        {/* Status */}
        <div className={cn(
          "flex items-center gap-3 p-3 border-2 border-black",
          isAlertMode && shouldTriggerAlert && hasXFetchData ? "bg-red-100" : "bg-gray-100"
        )}>
          <div className={cn('w-3 h-3', getStatusBg(), isGenerating && 'animate-pulse')} />
          <span className="text-xs font-bold uppercase tracking-wide text-black">
            {getStatusText()}
          </span>
        </div>

        {/* Alert Mode Indicator */}
        {isAlertMode && (
          <div className="flex items-center gap-2 p-3 border-2 border-yellow-500 bg-yellow-50">
            <Bell size={16} className="text-yellow-600" />
            <span className="text-xs font-bold uppercase text-yellow-800">
              ALERT MODE - Connected to X Monitor
            </span>
          </div>
        )}

        {/* Alert Title (for alert mode) */}
        {isAlertMode && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-black mb-2">
              ALERT TITLE
            </label>
            <input
              type="text"
              value={alertTitle}
              onChange={(e) => handleAlertTitleChange(e.target.value)}
              placeholder="Tesla Alert"
              className="w-full border-2 border-black px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black nodrag bg-white"
            />
          </div>
        )}

        {/* Recipient Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-black mb-2">
            RECIPIENT NAME
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={recipientName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Elon Musk"
              className="w-full border-2 border-black pl-10 pr-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black nodrag bg-white"
            />
          </div>
        </div>

        {/* Recipient Username */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-black mb-2">
            RECIPIENT USERNAME
          </label>
          <div className="relative">
            <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={recipientUsername}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="elonmusk"
              className="w-full border-2 border-black pl-10 pr-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black nodrag bg-white"
            />
          </div>
        </div>

        {/* Tweet Data Preview (Alert Mode) */}
        {isAlertMode && hasXFetchData && (
          <div className="border-2 border-black p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-black">
                TWEET DATA RECEIVED
              </span>
              <span className="text-xs font-bold text-green-600">
                {xFetchOutput.count} TWEETS
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Query: "{xFetchOutput.query}"
            </p>
          </div>
        )}

        {/* Manual Send Button (Alert Mode) */}
        {isAlertMode && hasXFetchData && isConfigured && !shouldTriggerAlert && (
          <button
            onClick={handleGenerateAlert}
            disabled={isGenerating}
            className={cn(
              'w-full py-3 font-bold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 border-2',
              isGenerating
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-black text-white border-black hover:bg-white hover:text-black'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                GENERATING...
              </>
            ) : (
              <>
                <Play size={16} />
                SEND ALERT NOW
              </>
            )}
          </button>
        )}

        {/* Message Preview (Original DM Mode) */}
        {!isAlertMode && hasMessage && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-black mb-2">
              MESSAGE TO SEND
            </label>
            <div className="nodrag border-2 border-black p-3 bg-gray-50 max-h-[100px] overflow-auto">
              <p className="text-xs text-black select-text cursor-text whitespace-pre-wrap">
                {String(connectedInput).slice(0, 280)}
                {String(connectedInput).length > 280 && '...'}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-bold">
              {String(connectedInput).length}/280 CHARACTERS
            </p>
          </div>
        )}

        {/* DM Preview Card */}
        {isConfigured && (
          <div className="border-2 border-black p-4 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-lg font-bold">
                {recipientName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-black">{recipientName}</p>
                <p className="text-xs text-gray-500">@{recipientUsername}</p>
              </div>
            </div>
            {!isAlertMode && hasMessage && (
              <div className="bg-black text-white p-3 ml-auto max-w-[80%]">
                <p className="text-xs">
                  {String(connectedInput).slice(0, 100)}
                  {String(connectedInput).length > 100 && '...'}
                </p>
              </div>
            )}
            {isAlertMode && hasXFetchData && (
              <div className="bg-red-500 text-white p-3 ml-auto max-w-[80%]">
                <p className="text-xs font-bold">🚨 {alertTitle}</p>
                <p className="text-xs mt-1 opacity-80">
                  {xFetchOutput.count} tweets about "{xFetchOutput.query}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Connection Hint */}
        <div className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-400 bg-gray-50">
          <Send size={14} className="text-gray-500" />
          <span className="text-xs text-gray-500 font-bold uppercase">
            {isAlertMode ? 'CONNECT TO PHONE FOR ALERT OUTPUT' : 'SIMULATED OUTPUT - CONNECT TO PHONE NODE'}
          </span>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(XDMNode);
