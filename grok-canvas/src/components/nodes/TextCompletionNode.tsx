import React, { memo, useState, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { MessageSquare, Play, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import type { TextCompletionBlock } from '../../types/canvas';

const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY;

const TextCompletionNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as TextCompletionBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const nodeExecutionStates = useCanvasStore((s) => s.nodeExecutionStates);
  const setNodeExecutionStatus = useCanvasStore((s) => s.setNodeExecutionStatus);
  const setNodeOutput = useCanvasStore((s) => s.setNodeOutput);
  const getInputFromConnections = useCanvasStore((s) => s.getInputFromConnections);

  const [output, setOutput] = useState<string | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputPreview, setInputPreview] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const executionState = nodeExecutionStates[id];
  const status = executionState?.status || 'idle';
  const isExecuting = status === 'running';

  const handleCopyOutput = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const handleExecute = useCallback(async () => {
    if (isExecuting) return;

    // Get input from connected node
    const connectedInput = getInputFromConnections(id);

    let inputText = '';
    if (connectedInput) {
      // If it's from X Search, format the tweets
      if (typeof connectedInput === 'object' && 'tweets' in (connectedInput as any)) {
        const xOutput = connectedInput as { tweets: any[], query: string };
        inputText = `Search results for "${xOutput.query}":\n\n` +
          xOutput.tweets.map((t: any, i: number) =>
            `${i + 1}. @${t.authorUsername}: ${t.text}`
          ).join('\n\n');
      } else if (typeof connectedInput === 'string') {
        inputText = connectedInput;
      } else {
        inputText = JSON.stringify(connectedInput, null, 2);
      }
    }

    if (!inputText) {
      setOutput('No input received. Connect this node to an X Search node first.');
      setShowOutput(true);
      return;
    }

    // Save input preview so user can verify what was sent
    setInputPreview(inputText);
    setNodeExecutionStatus(id, 'running');
    setOutput(null);

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: nodeData.model === 'grok-4' ? 'grok-3' : nodeData.model === 'grok-4-fast' ? 'grok-3-fast' : 'grok-3-mini',
          messages: [
            {
              role: 'system',
              content: nodeData.systemPrompt || 'You are a helpful assistant that summarizes and analyzes content.',
            },
            {
              role: 'user',
              content: inputText,
            },
          ],
          temperature: nodeData.temperature,
          max_tokens: nodeData.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const result = await response.json();
      const completionText = result.choices?.[0]?.message?.content || 'No response generated';

      setOutput(completionText);
      setNodeOutput(id, completionText);
      setNodeExecutionStatus(id, 'success');
      setShowOutput(true);

    } catch (error) {
      console.error('Text completion error:', error);
      setNodeExecutionStatus(id, 'error', error instanceof Error ? error.message : 'Unknown error');
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowOutput(true);
    }
  }, [id, nodeData, isExecuting, getInputFromConnections, setNodeExecutionStatus, setNodeOutput]);

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-emerald-500 animate-pulse';
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const connectedInput = getInputFromConnections(id);
  const hasInput = connectedInput !== undefined;

  return (
    <BaseNode
      id={id}
      title="Text Completion"
      icon={<MessageSquare size={18} strokeWidth={2} />}
      color="#10b981"
      width={nodeData.size.width}
    >
      <div className="space-y-4">
        {/* Status Bar */}
        <div className="flex items-center gap-3 bg-gray-900/60 rounded-xl px-4 py-2.5 border border-gray-700/50">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-[12px] text-gray-400 font-medium flex-1">
            {status === 'idle' && (hasInput ? 'Ready - input received' : 'Waiting for input')}
            {status === 'running' && 'Generating...'}
            {status === 'success' && 'Complete'}
            {status === 'error' && 'Error'}
          </span>
          {isExecuting && <Loader2 size={14} className="animate-spin text-emerald-400" />}
          {status === 'success' && <CheckCircle size={14} className="text-emerald-400" />}
          {status === 'error' && <AlertCircle size={14} className="text-red-400" />}
        </div>

        {/* Input indicator with preview */}
        {hasInput && (
          <div className="space-y-2">
            <button
              onClick={() => setShowInput(!showInput)}
              className="text-[11px] text-emerald-400 flex items-center gap-2 px-1 hover:text-emerald-300 transition-colors"
            >
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Input received from connected node
              <span className="text-gray-500">({showInput ? 'hide' : 'show'})</span>
            </button>
            {showInput && inputPreview && (
              <div className="nodrag nowheel bg-gray-900/60 border border-emerald-500/30 rounded-xl p-3 max-h-[150px] overflow-auto cursor-text select-text">
                <div className="text-[11px] text-emerald-300 font-medium mb-2">What was sent to Grok:</div>
                <pre className="text-[10px] text-gray-400 whitespace-pre-wrap select-text font-mono">
                  {inputPreview.slice(0, 1000)}{inputPreview.length > 1000 ? '...' : ''}
                </pre>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Model</label>
          <select
            value={nodeData.model}
            onChange={(e) => updateBlock(id, { model: e.target.value as TextCompletionBlock['model'] })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-emerald-500/50 focus:bg-gray-900/80 transition-all duration-200 cursor-pointer"
          >
            <option value="grok-4">Grok 3</option>
            <option value="grok-4-fast">Grok 3 Fast</option>
            <option value="grok-3-mini">Grok 3 Mini</option>
          </select>
        </div>

        <div>
          <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">System Prompt</label>
          <textarea
            value={nodeData.systemPrompt}
            onChange={(e) => updateBlock(id, { systemPrompt: e.target.value })}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-gray-900/80 resize-none transition-all duration-200 leading-relaxed nodrag"
            placeholder="Summarize these tweets and identify key themes..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">
              Temperature
              <span className="ml-2 text-emerald-400 font-semibold">{nodeData.temperature}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={nodeData.temperature}
              onChange={(e) => updateBlock(id, { temperature: parseFloat(e.target.value) })}
              className="w-full h-2 nodrag"
            />
          </div>
          <div>
            <label className="text-[13px] text-gray-400 mb-2.5 block font-medium tracking-wide">Max Tokens</label>
            <input
              type="number"
              value={nodeData.maxTokens}
              onChange={(e) => updateBlock(id, { maxTokens: parseInt(e.target.value) || 1024 })}
              className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-emerald-500/50 focus:bg-gray-900/80 transition-all duration-200 nodrag"
            />
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={isExecuting || !hasInput}
          className={`w-full py-3 rounded-xl font-medium text-[14px] transition-all duration-200 flex items-center justify-center gap-2 ${
            isExecuting
              ? 'bg-gray-700 text-gray-400 cursor-wait'
              : hasInput
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isExecuting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              Generate with Grok
            </>
          )}
        </button>

        {/* Output */}
        {output && (
          <div className="border-t border-gray-700/50 pt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOutput(!showOutput)}
                className="flex-1 flex items-center justify-between px-3 py-2 bg-gray-900/40 hover:bg-gray-800/60 rounded-lg text-[12px] text-gray-300 transition-all duration-200"
              >
                <span className="font-medium">Output</span>
                {showOutput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                onClick={handleCopyOutput}
                className="px-3 py-2 bg-gray-900/40 hover:bg-gray-800/60 rounded-lg text-[12px] text-gray-300 transition-all duration-200 flex items-center gap-1.5"
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {showOutput && (
              <div className="nodrag nowheel mt-2 bg-gray-900/60 border border-gray-700/50 rounded-xl p-3 max-h-[200px] overflow-auto cursor-text select-text">
                <div className="text-[13px] text-gray-200 whitespace-pre-wrap select-text leading-relaxed">
                  {output}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default memo(TextCompletionNode);
