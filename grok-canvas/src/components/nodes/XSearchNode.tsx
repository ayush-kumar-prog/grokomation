import React, { memo, useState, useRef, useEffect } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Send, Sparkles } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import type { XSearchBlock } from '../../types/canvas';

// X Logo SVG Component
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
    "Find today's trending tweets",
    "Search @elonmusk's recent posts",
    "What's happening in tech Twitter?",
  ];

  return (
    <BaseNode
      id={id}
      title="X"
      icon={<XLogo size={18} />}
      color="#000000"
      width={nodeData.size.width}
    >
      <div className="flex flex-col h-[320px]">
        {/* Header Info */}
        <div className="flex items-center gap-3 bg-gray-900/60 rounded-xl px-4 py-3 border border-gray-700/50 mb-4">
          <div className="w-2 h-2 bg-white rounded-full" />
          <span className="text-[13px] text-gray-300 font-medium">Natural Language Search</span>
          <Sparkles size={14} className="text-gray-500 ml-auto" />
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-1 min-h-0">
          {nodeData.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-4">
                <XLogo size={24} className="text-white" />
              </div>
              <p className="text-[14px] text-gray-400 mb-4 leading-relaxed">
                Ask anything about X in natural language
              </p>
              <div className="space-y-2 w-full">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(suggestion)}
                    className="w-full text-left px-4 py-2.5 bg-gray-900/40 hover:bg-gray-800/60 border border-gray-700/30 rounded-xl text-[13px] text-gray-400 hover:text-gray-200 transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {nodeData.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-white text-black rounded-br-md'
                        : 'bg-gray-800/80 text-gray-200 rounded-bl-md border border-gray-700/50'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search X..."
              rows={1}
              className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 pr-12 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:bg-gray-900/80 resize-none transition-all duration-200"
              style={{ minHeight: '48px', maxHeight: '96px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`p-3 rounded-xl transition-all duration-200 ${
              inputValue.trim()
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(XSearchNode);
