import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import {
  Send,
  X,
  GripHorizontal,
} from 'lucide-react';
import type { TextCompletionBlock } from '../../types/canvas';
import { useCanvasStore } from '../../stores/canvasStore';
import {
  llmRouter,
  getWorkflowType,
  executeWorkflow,
  type ChatMessage as ApiChatMessage,
} from '../../services';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const TextCompletionNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as TextCompletionBlock;
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get canvas store for workflow detection
  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);
  const updateBlock = useCanvasStore((s) => s.updateBlock);

  // Detect if this chat is connected to a workflow (Chat → Processing → Phone)
  const workflowInfo = useMemo(() => {
    return getWorkflowType(id, blocks, connections);
  }, [id, blocks, connections]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userContent = inputValue.trim();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if we have a workflow connection (Chat → Processing → Phone)
      if (workflowInfo.hasWorkflow && workflowInfo.targetId && workflowInfo.processingType) {
        console.log('[TextCompletionNode] Workflow detected, executing...', workflowInfo);

        // Determine content type based on processing node
        const contentType = workflowInfo.processingType === 'codeExecution'
          ? 'code'
          : workflowInfo.processingType === 'webSearch'
          ? 'webSearch'
          : workflowInfo.processingType === 'reasoning'
          ? 'reasoning'
          : workflowInfo.processingType === 'xFetch'
          ? 'xFetch'
          : 'image';
        console.log('[TextCompletionNode] Content type:', contentType);

        // Set phone to loading state
        updateBlock(workflowInfo.targetId, {
          isLoading: true,
          contentType,
          error: undefined,
        });

        // Execute the workflow
        const result = await executeWorkflow(userContent, workflowInfo.processingType);

        // Update the phone with the result
        updateBlock(workflowInfo.targetId, {
          isLoading: false,
          contentType: result.contentType,
          content: result.content,
          error: result.error,
        });

        // Add assistant message indicating workflow execution
        const getSuccessMessage = () => {
          if (workflowInfo.processingType === 'webSearch') {
            return '✓ Web search complete! Results shown on phone.';
          } else if (workflowInfo.processingType === 'reasoning') {
            return '✓ Deep research complete! Analysis shown on phone.';
          } else if (workflowInfo.processingType === 'xFetch') {
            return '✓ X search complete! Posts shown on phone.';
          } else if (result.contentType === 'code') {
            return '✓ Generated app and sent to phone!';
          } else {
            return '✓ Created image and sent to phone!';
          }
        };
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.success
            ? getSuccessMessage()
            : `✗ Failed: ${result.error}`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Regular chat mode - no workflow connection
        // Build conversation history for the API
        const apiMessages: ApiChatMessage[] = [
          ...messages.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          { role: 'user' as const, content: userContent },
        ];

        // Call the Grok Chat Completion API
        const response = await llmRouter.chat({
          messages: apiMessages,
          model: nodeData.model || 'grok-4-latest',
          temperature: nodeData.temperature ?? 0.7,
          maxTokens: nodeData.maxTokens,
          systemPrompt: nodeData.systemPrompt,
        });

        if (response.success && response.data) {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.content,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          // Handle error
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Error: ${response.error || 'Failed to get response from Grok'}`,
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeBlock = useCanvasStore((s) => s.removeBlock);

  // Get workflow mode label
  const getModeLabel = () => {
    if (!workflowInfo.hasWorkflow) return 'CHAT';
    switch (workflowInfo.processingType) {
      case 'codeExecution': return 'CODE';
      case 'vision':
      case 'imageInput': return 'IMAGE';
      case 'webSearch': return 'SEARCH';
      case 'reasoning': return 'RESEARCH';
      case 'xFetch': return 'X';
      default: return 'WORKFLOW';
    }
  };

  return (
    <div
      className="relative"
      style={{ width: nodeData.size.width, height: nodeData.size.height }}
    >
      {/* Connection Handles - Brutalist square style */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !rounded-none !border-2 !border-black !bg-white"
        style={{ top: -6 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !rounded-none !border-2 !border-black !bg-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !rounded-none !border-2 !border-black !bg-white"
        style={{ right: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !rounded-none !border-2 !border-black !bg-white"
        style={{ bottom: -6 }}
      />

      {/* Main container - Brutalist style */}
      <div
        className="h-full flex flex-col"
        style={{
          background: '#ffffff',
          border: '3px solid #000000',
        }}
      >
        {/* Header - Black bar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: '#000000',
            borderBottom: '3px solid #000000',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="font-black text-base tracking-tight"
              style={{ color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}
            >
              GROK
            </span>
            <span
              className="px-2 py-0.5 text-[10px] font-bold tracking-widest"
              style={{
                background: '#ffffff',
                color: '#000000',
                border: '2px solid #ffffff',
              }}
            >
              {getModeLabel()}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-0">
            <div
              className="drag-handle cursor-grab active:cursor-grabbing p-2 hover:bg-white/20 transition-colors"
              title="DRAG"
            >
              <GripHorizontal size={16} color="#ffffff" strokeWidth={3} />
            </div>
            <button
              onClick={() => removeBlock(id)}
              className="p-2 hover:bg-white/20 transition-colors"
              title="DELETE"
            >
              <X size={16} color="#ffffff" strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            padding: '16px',
            background: '#ffffff',
          }}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              {/* Brutalist logo */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  background: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #000000',
                }}
              >
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: '32px',
                    fontWeight: '900',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  G
                </span>
              </div>

              {workflowInfo.hasWorkflow ? (
                <>
                  <div
                    style={{
                      padding: '8px 16px',
                      background: '#000000',
                      border: '2px solid #000000',
                    }}
                  >
                    <span
                      style={{
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '800',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {getModeLabel()} MODE ACTIVE
                    </span>
                  </div>
                  <p
                    style={{
                      color: '#000000',
                      fontSize: '12px',
                      fontWeight: '600',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      lineHeight: '1.6',
                      maxWidth: '280px',
                    }}
                  >
                    {workflowInfo.processingType === 'codeExecution'
                      ? 'DESCRIBE AN APP TO GENERATE'
                      : (workflowInfo.processingType === 'vision' || workflowInfo.processingType === 'imageInput')
                      ? 'DESCRIBE AN IMAGE TO CREATE'
                      : workflowInfo.processingType === 'webSearch'
                      ? 'ASK ANYTHING TO SEARCH'
                      : workflowInfo.processingType === 'reasoning'
                      ? 'ASK COMPLEX QUESTIONS'
                      : workflowInfo.processingType === 'xFetch'
                      ? 'SEARCH X FOR POSTS'
                      : 'SEND A MESSAGE TO START'}
                  </p>
                </>
              ) : (
                <p
                  style={{
                    color: '#666666',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  START TYPING...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  {msg.role === 'user' ? (
                    /* User Message - Right aligned, inverted */
                    <div style={{ maxWidth: '85%' }}>
                      <div
                        style={{
                          padding: '12px 16px',
                          background: '#000000',
                          border: '2px solid #000000',
                        }}
                      >
                        <p
                          style={{
                            color: '#ffffff',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            fontWeight: '500',
                            margin: 0,
                          }}
                        >
                          {msg.content}
                        </p>
                      </div>
                      <div
                        style={{
                          marginTop: '4px',
                          textAlign: 'right',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            color: '#000000',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}
                        >
                          YOU
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message - Left aligned, outlined */
                    <div style={{ maxWidth: '85%' }}>
                      <div
                        style={{
                          padding: '12px 16px',
                          background: '#ffffff',
                          border: '2px solid #000000',
                        }}
                      >
                        <p
                          style={{
                            color: '#000000',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            fontWeight: '500',
                            margin: 0,
                          }}
                        >
                          {msg.content}
                        </p>
                      </div>
                      <div
                        style={{
                          marginTop: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            color: '#000000',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}
                        >
                          GROK
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator - Brutalist */}
              {isLoading && (
                <div className="flex justify-start">
                  <div style={{ maxWidth: '85%' }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        background: '#ffffff',
                        border: '2px solid #000000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              width: '8px',
                              height: '8px',
                              background: '#000000',
                              animation: `brutalistPulse 1s ease-in-out ${i * 0.2}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          color: '#000000',
                          fontSize: '11px',
                          fontWeight: '800',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        PROCESSING
                      </span>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: '800',
                          color: '#000000',
                          letterSpacing: '0.1em',
                        }}
                      >
                        GROK
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Bottom */}
        <div
          style={{
            padding: '12px 16px 16px',
            borderTop: '3px solid #000000',
            background: '#ffffff',
          }}
        >
          {/* Input Container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              border: '2px solid #000000',
              background: '#ffffff',
            }}
          >
            {/* Textarea */}
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                workflowInfo.hasWorkflow
                  ? workflowInfo.processingType === 'codeExecution'
                    ? 'DESCRIBE APP...'
                    : (workflowInfo.processingType === 'vision' || workflowInfo.processingType === 'imageInput')
                    ? 'DESCRIBE IMAGE...'
                    : workflowInfo.processingType === 'webSearch'
                    ? 'SEARCH QUERY...'
                    : workflowInfo.processingType === 'reasoning'
                    ? 'COMPLEX QUESTION...'
                    : workflowInfo.processingType === 'xFetch'
                    ? 'SEARCH X FOR...'
                    : 'TYPE MESSAGE...'
                  : 'TYPE MESSAGE...'
              }
              disabled={isLoading}
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                color: '#000000',
                fontSize: '13px',
                fontWeight: '600',
                padding: '12px',
                border: 'none',
                outline: 'none',
                resize: 'none',
                minHeight: '24px',
                maxHeight: '80px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                fontFamily: 'system-ui, sans-serif',
              }}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              style={{
                width: '48px',
                height: '48px',
                background: !inputValue.trim() || isLoading ? '#cccccc' : '#000000',
                color: !inputValue.trim() || isLoading ? '#666666' : '#ffffff',
                border: 'none',
                cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.1s',
              }}
              title="SEND"
            >
              <Send size={18} strokeWidth={3} />
            </button>
          </div>

          {/* Keyboard hint */}
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <span
              style={{
                fontSize: '9px',
                fontWeight: '700',
                color: '#666666',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              ENTER TO SEND
            </span>
          </div>
        </div>
      </div>

      {/* CSS for brutalist pulse animation */}
      <style>{`
        @keyframes brutalistPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default memo(TextCompletionNode);
