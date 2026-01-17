import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { MessageSquare, Send, Image as ImageIcon, Workflow } from 'lucide-react';
import BaseNode from './BaseNode';
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

  return (
    <BaseNode
      id={id}
      title="Grok Chat"
      icon={<MessageSquare size={18} strokeWidth={2} />}
      color="#374151"
      width={nodeData.size.width}
      height={nodeData.size.height}
    >
      <div className="flex flex-col" style={{ height: nodeData.size.height - 140 }}>
        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: '16px', paddingBottom: '8px' }}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              {workflowInfo.hasWorkflow ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full">
                    <Workflow size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-medium">
                      {workflowInfo.processingType === 'codeExecution' ? 'Code Generation' :
                       (workflowInfo.processingType === 'vision' || workflowInfo.processingType === 'imageInput') ? 'Image Generation' :
                       workflowInfo.processingType === 'webSearch' ? 'Web Search' :
                       workflowInfo.processingType === 'reasoning' ? 'Deep Research' : 'Workflow'} Mode
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm text-center px-4">
                    {workflowInfo.processingType === 'codeExecution'
                      ? 'Describe an app and it will be generated!'
                      : (workflowInfo.processingType === 'vision' || workflowInfo.processingType === 'imageInput')
                      ? 'Describe an image and it will be created!'
                      : workflowInfo.processingType === 'webSearch'
                      ? 'Ask any question to search the web!'
                      : workflowInfo.processingType === 'reasoning'
                      ? 'Ask complex questions for deep analysis!'
                      : 'Send a message to execute the workflow'}
                  </p>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Start a conversation...</p>
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
                    /* User Message */
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '12px 16px',
                        borderRadius: '18px 18px 4px 18px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    /* Assistant Message */
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '12px 16px',
                        borderRadius: '18px 18px 18px 4px',
                        background: '#1f2937',
                        color: '#e5e7eb',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        borderLeft: '3px solid #10b981',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '18px 18px 18px 4px',
                      background: '#1f2937',
                      color: '#9ca3af',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      className="animate-spin"
                      style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #374151',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                      }}
                    />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: '8px 12px 12px 12px',
            borderTop: '1px solid #374151',
          }}
        >
          {/* Input Container */}
          <div
            style={{
              background: '#111827',
              borderRadius: '12px',
              border: '1px solid #374151',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              padding: '8px 10px',
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
                    ? 'Describe an app to generate...'
                    : (workflowInfo.processingType === 'vision' || workflowInfo.processingType === 'imageInput')
                    ? 'Describe an image to create...'
                    : workflowInfo.processingType === 'webSearch'
                    ? 'Search the web for anything...'
                    : workflowInfo.processingType === 'reasoning'
                    ? 'Ask a complex question to analyze...'
                    : 'Type your message...'
                  : 'Type your message...'
              }
              disabled={isLoading}
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                color: 'white',
                fontSize: '14px',
                padding: '6px 8px',
                border: 'none',
                outline: 'none',
                resize: 'none',
                minHeight: '32px',
                maxHeight: '80px',
              }}
            />

            {/* Buttons */}
            <button
              disabled={isLoading}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#374151',
                color: '#9ca3af',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Upload image"
            >
              <ImageIcon size={16} />
            </button>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: !inputValue.trim() || isLoading ? '#374151' : '#3b82f6',
                color: !inputValue.trim() || isLoading ? '#6b7280' : 'white',
                border: 'none',
                cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(TextCompletionNode);
