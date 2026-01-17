import React, { memo, useState, useCallback, useEffect } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Bell, Copy, Check, Mail, Send, MessageCircle } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';

interface NotificationNodeData {
  size: { width: number; height: number };
  email: string;
  notificationType: 'browser' | 'email' | 'both';
}

const PostToXNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as NotificationNodeData;
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const getInputFromConnections = useCanvasStore((s) => s.getInputFromConnections);
  const nodeExecutionStates = useCanvasStore((s) => s.nodeExecutionStates);
  const setNodeExecutionStatus = useCanvasStore((s) => s.setNodeExecutionStatus);

  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState(nodeData.email || '');
  const [notificationSent, setNotificationSent] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const connectedInput = getInputFromConnections(id);
  const hasInput = connectedInput !== undefined;
  const status = nodeExecutionStates[id]?.status || 'idle';

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Format the input for display
  const getFormattedContent = useCallback(() => {
    if (!connectedInput) return '';

    let content = '';
    if (typeof connectedInput === 'string') {
      content = connectedInput;
    } else if (typeof connectedInput === 'object') {
      if ('tweets' in (connectedInput as any)) {
        const xOutput = connectedInput as { tweets: any[], query: string };
        content = `Results for "${xOutput.query}":\n\n` +
          xOutput.tweets.slice(0, 5).map((t: any) =>
            `@${t.authorUsername}: ${t.text.slice(0, 100)}...`
          ).join('\n\n');
      } else {
        content = JSON.stringify(connectedInput, null, 2);
      }
    }

    return content;
  }, [connectedInput]);

  const handleCopy = useCallback(() => {
    const content = getFormattedContent();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getFormattedContent]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  const sendBrowserNotification = useCallback(async () => {
    const content = getFormattedContent();

    if (notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Please enable notifications to receive alerts');
        return false;
      }
    }

    // Create notification
    const notification = new Notification('Grok Flows Result', {
      body: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
      icon: 'https://x.com/favicon.ico',
      tag: 'grok-flows-result',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  }, [getFormattedContent, notificationPermission, requestNotificationPermission]);

  const sendEmail = useCallback(() => {
    const content = getFormattedContent();
    const subject = encodeURIComponent('Grok Flows Result');
    const body = encodeURIComponent(content);
    const emailTo = email || '';

    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, '_blank');
    return true;
  }, [getFormattedContent, email]);

  const handleSendNotification = useCallback(async () => {
    if (!hasInput) return;

    setNodeExecutionStatus(id, 'running');
    setNotificationSent(false);

    try {
      const browserSent = await sendBrowserNotification();

      if (browserSent) {
        setNotificationSent(true);
        setNodeExecutionStatus(id, 'success');

        // Auto-reset after 3 seconds
        setTimeout(() => {
          setNotificationSent(false);
        }, 3000);
      } else {
        setNodeExecutionStatus(id, 'error', 'Failed to send notification');
      }
    } catch (error) {
      setNodeExecutionStatus(id, 'error', 'Notification error');
    }
  }, [hasInput, id, sendBrowserNotification, setNodeExecutionStatus]);

  const handleSaveEmail = useCallback((value: string) => {
    setEmail(value);
    updateBlock(id, { email: value });
  }, [id, updateBlock]);

  const formattedContent = getFormattedContent();

  const getStatusColor = () => {
    if (notificationSent) return 'bg-emerald-500';
    if (status === 'running') return 'bg-blue-500 animate-pulse';
    if (hasInput) return 'bg-emerald-500';
    return 'bg-gray-500';
  };

  return (
    <BaseNode
      id={id}
      title="Notify Me"
      icon={<Bell size={18} />}
      color="#8b5cf6"
      width={340}
    >
      <div className="space-y-4">
        {/* Status */}
        <div className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border ${
          hasInput
            ? 'bg-purple-900/20 border-purple-500/30'
            : 'bg-gray-900/60 border-gray-700/50'
        }`}>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-[12px] text-gray-400 font-medium">
            {notificationSent ? '✓ Notification sent!' : hasInput ? 'Ready to notify' : 'Waiting for input'}
          </span>
        </div>

        {/* Notification Permission Status */}
        {notificationPermission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            className="w-full py-2 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-[12px] hover:bg-purple-600/30 transition-colors"
          >
            <Bell size={12} className="inline mr-2" />
            Click to enable browser notifications
          </button>
        )}

        {/* Email (optional) */}
        <div>
          <label className="text-[13px] text-gray-400 mb-2 block font-medium">
            <Mail size={12} className="inline mr-1" />
            Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => handleSaveEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 nodrag"
          />
        </div>

        {/* Preview */}
        {hasInput && (
          <div>
            <label className="text-[13px] text-gray-400 mb-2 block font-medium">Preview</label>
            <div className="nodrag nowheel bg-gray-900/60 border border-gray-700/50 rounded-xl p-3 max-h-[120px] overflow-auto">
              <p className="text-[12px] text-gray-200 whitespace-pre-wrap select-text">
                {formattedContent.slice(0, 300)}{formattedContent.length > 300 ? '...' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Primary: Send Browser Notification */}
          <button
            onClick={handleSendNotification}
            disabled={!hasInput || status === 'running'}
            className={`w-full py-3 rounded-xl font-medium text-[14px] transition-all duration-200 flex items-center justify-center gap-2 ${
              notificationSent
                ? 'bg-emerald-600 text-white'
                : hasInput
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {notificationSent ? (
              <>
                <Check size={16} />
                Notification Sent!
              </>
            ) : (
              <>
                <Bell size={16} />
                Send Browser Notification
              </>
            )}
          </button>

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={sendEmail}
              disabled={!hasInput}
              className={`py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 flex items-center justify-center gap-2 ${
                hasInput
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Mail size={14} />
              Email
            </button>

            <button
              onClick={handleCopy}
              disabled={!hasInput}
              className={`py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 flex items-center justify-center gap-2 ${
                hasInput
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* DM hint */}
          <p className="text-[11px] text-gray-500 text-center">
            <MessageCircle size={10} className="inline mr-1" />
            For X DMs, copy and paste into your DM conversation
          </p>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(PostToXNode);
