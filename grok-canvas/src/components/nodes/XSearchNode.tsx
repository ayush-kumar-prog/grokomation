import React, { memo, useState, useRef, useEffect } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Send, Search } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { cn } from '@/lib/utils';
import type { XSearchBlock } from '../../types/canvas';

const XLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const XSearchNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as XSearchBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [nodeData.messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage = { role: 'user' as const, content: inputValue.trim() };
    updateBlock(id, {
      query: inputValue.trim(),
      messages: [...nodeData.messages, newMessage],
    });
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    { text: "Find today's trending tweets", icon: "🔥" },
    { text: "Search @elonmusk's recent posts", icon: "👤" },
    { text: "What's happening in tech?", icon: "💻" },
  ];

  return (
    <BaseNode
      id={id}
      title=""
      icon={<XLogo size={20} />}
      color="#18181b"
      width={nodeData.size.width}
    >
      <div className="flex flex-col h-[340px] px-2">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[#0f1318] rounded-xl border border-[#2a3441] mb-4">
          {nodeData.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              {/* Description */}
              <p className="text-[14px] text-gray-400 mb-8 text-center leading-relaxed">
                Search posts, users, and trends<br />using natural language
              </p>

              {/* Suggestions */}
              <div className="w-full max-w-[280px] mx-auto space-y-3">
                <span className="text-[11px] text-gray-600 uppercase tracking-wider font-medium block mb-3 text-center">
                  Try asking
                </span>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(suggestion.text)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f25] hover:bg-[#252d38] border border-[#2a3441] hover:border-[#3a4451] rounded-xl text-[13px] text-gray-300 hover:text-white transition-all group"
                  >
                    <span className="text-base opacity-60 group-hover:opacity-100 transition-opacity">
                      {suggestion.icon}
                    </span>
                    <span className="flex-1 text-left">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {nodeData.messages.map((message, index) => (
                <div
                  key={index}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] px-4 py-2.5 text-[13px] leading-relaxed',
                      message.role === 'user'
                        ? 'bg-white text-black rounded-2xl rounded-br-md'
                        : 'bg-[#1a1f25] text-gray-300 border border-[#2a3441] rounded-2xl rounded-bl-md'
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything to X"
              className="w-full bg-[#0f1318] border border-[#2a3441] rounded-2xl text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#3a4451] transition-colors"
              style={{ paddingLeft: '24px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              'h-9 w-9 flex items-center justify-center rounded-lg transition-all flex-shrink-0',
              inputValue.trim()
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-[#0f1318] text-gray-600 border border-[#2a3441]'
            )}
          >
            <Send size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(XSearchNode);
