import React, { memo, useState, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Send, User, AtSign } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { cn } from '@/lib/utils';
import type { XDMBlock } from '../../types/canvas';

const XLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const XDMNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as XDMBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const getInputFromConnections = useCanvasStore((s) => s.getInputFromConnections);

  const [recipientName, setRecipientName] = useState(nodeData.recipientName || '');
  const [recipientUsername, setRecipientUsername] = useState(nodeData.recipientUsername || '');

  // Get message from connected input
  const connectedInput = getInputFromConnections(id);
  const hasMessage = !!connectedInput;

  const handleNameChange = useCallback((value: string) => {
    setRecipientName(value);
    updateBlock(id, { recipientName: value });
  }, [id, updateBlock]);

  const handleUsernameChange = useCallback((value: string) => {
    setRecipientUsername(value);
    updateBlock(id, { recipientUsername: value });
  }, [id, updateBlock]);

  const isConfigured = recipientName.trim() && recipientUsername.trim();

  const getStatusText = () => {
    if (!recipientName.trim()) return 'ENTER RECIPIENT NAME';
    if (!recipientUsername.trim()) return 'ENTER RECIPIENT USERNAME';
    if (!hasMessage) return 'CONNECT MESSAGE INPUT';
    return 'READY TO SEND DM';
  };

  const getStatusBg = () => {
    if (isConfigured && hasMessage) return 'bg-green-500';
    if (isConfigured) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <BaseNode
      id={id}
      title="X DM"
      icon={<XLogo size={18} />}
      color="#000000"
      width={nodeData.size?.width || 320}
    >
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3 p-3 border-2 border-black bg-gray-100">
          <div className={cn('w-3 h-3', getStatusBg())} />
          <span className="text-xs font-bold uppercase tracking-wide text-black">
            {getStatusText()}
          </span>
        </div>

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

        {/* Message Preview */}
        {hasMessage && (
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
            {hasMessage && (
              <div className="bg-black text-white p-3 ml-auto max-w-[80%]">
                <p className="text-xs">
                  {String(connectedInput).slice(0, 100)}
                  {String(connectedInput).length > 100 && '...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Simulated Status */}
        <div className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-400 bg-gray-50">
          <Send size={14} className="text-gray-500" />
          <span className="text-xs text-gray-500 font-bold uppercase">
            SIMULATED OUTPUT - CONNECT TO PHONE NODE
          </span>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(XDMNode);
