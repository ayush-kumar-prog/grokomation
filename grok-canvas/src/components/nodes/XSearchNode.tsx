import React, { memo, useState, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Play, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import BaseNode from './BaseNode';
import { useCanvasStore } from '../../stores/canvasStore';
import { executeXNode } from '../../lib/nodeExecutor';
import type { XSearchBlock, XNodeOutput } from '../../types/canvas';

// X Logo SVG Component
const XLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const XSearchNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as XSearchBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const nodeExecutionStates = useCanvasStore((s) => s.nodeExecutionStates);
  const setNodeExecutionStatus = useCanvasStore((s) => s.setNodeExecutionStatus);
  const setNodeOutput = useCanvasStore((s) => s.setNodeOutput);
  const getInputFromConnections = useCanvasStore((s) => s.getInputFromConnections);

  const [inputValue, setInputValue] = useState(nodeData.query || '');
  const [showOutput, setShowOutput] = useState(false);
  const [output, setOutput] = useState<XNodeOutput | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyOutput = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(JSON.stringify(output, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const executionState = nodeExecutionStates[id];
  const status = executionState?.status || 'idle';
  const isExecuting = status === 'validating' || status === 'running';

  const suggestions = [
    "notify me when #tesla posts > 500/hr",
    "search @elonmusk's recent AI posts",
    "find trending #crypto discussions",
  ];

  const handleExecute = useCallback(async () => {
    // Get query - either from input or from connected node
    const connectedInput = getInputFromConnections(id);
    const query = inputValue.trim() || (typeof connectedInput === 'string' ? connectedInput : '');

    if (!query) {
      setValidationError('Please enter a search query');
      return;
    }

    // Clear previous state
    setValidationError(null);
    setOutput(null);

    // Update the block with the query
    updateBlock(id, { query });

    // Start validation
    setNodeExecutionStatus(id, 'validating');

    try {
      const result = await executeXNode(nodeData, query);

      if (!result.success) {
        setNodeExecutionStatus(id, 'error', result.error);
        setValidationError(result.validationResult?.reason || result.error || 'Execution failed');
        return;
      }

      // Success!
      setNodeExecutionStatus(id, 'success');
      setNodeOutput(id, result.output);
      setOutput(result.output || null);
      setShowOutput(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setNodeExecutionStatus(id, 'error', errorMsg);
      setValidationError(errorMsg);
    }
  }, [id, inputValue, nodeData, updateBlock, setNodeExecutionStatus, setNodeOutput, getInputFromConnections]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isExecuting) {
      e.preventDefault();
      handleExecute();
    }
  };

  // Status indicator color
  const getStatusColor = () => {
    switch (status) {
      case 'validating':
        return 'bg-yellow-500';
      case 'running':
        return 'bg-blue-500 animate-pulse';
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'validating':
      case 'running':
        return <Loader2 size={14} className="animate-spin" />;
      case 'success':
        return <CheckCircle size={14} />;
      case 'error':
        return <AlertCircle size={14} />;
      default:
        return null;
    }
  };

  return (
    <BaseNode
      id={id}
      title="X Search"
      icon={<XLogo size={18} />}
      color="#000000"
      width={nodeData.size.width}
    >
      <div className="flex flex-col" style={{ minHeight: showOutput ? '420px' : '280px' }}>
        {/* Status Bar */}
        <div className="flex items-center gap-3 bg-gray-900/60 rounded-xl px-4 py-2.5 border border-gray-700/50 mb-3">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-[12px] text-gray-400 font-medium flex-1">
            {status === 'idle' && 'Ready to search'}
            {status === 'validating' && 'Validating query...'}
            {status === 'running' && 'Searching X...'}
            {status === 'success' && `Found ${output?.count || 0} tweets`}
            {status === 'error' && 'Error'}
          </span>
          {getStatusIcon() && (
            <span className={status === 'error' ? 'text-red-400' : 'text-gray-400'}>
              {getStatusIcon()}
            </span>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-3">
            <p className="text-[12px] text-red-400">{validationError}</p>
          </div>
        )}

        {/* Suggestions (when idle) */}
        {status === 'idle' && !inputValue && (
          <div className="space-y-1.5 mb-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputValue(suggestion)}
                className="w-full text-left px-3 py-2 bg-gray-900/40 hover:bg-gray-800/60 border border-gray-700/30 rounded-lg text-[12px] text-gray-400 hover:text-gray-200 transition-all duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2 items-stretch mb-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your X search query..."
            rows={2}
            disabled={isExecuting}
            className="flex-1 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:bg-gray-900/80 resize-none transition-all duration-200 disabled:opacity-50"
          />
          <button
            onClick={handleExecute}
            disabled={isExecuting || !inputValue.trim()}
            className={`px-4 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isExecuting
                ? 'bg-gray-700 text-gray-400 cursor-wait'
                : inputValue.trim()
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isExecuting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
          </button>
        </div>

        {/* Output Preview */}
        {output && (
          <div className="border-t border-gray-700/50 pt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOutput(!showOutput)}
                className="flex-1 flex items-center justify-between px-3 py-2 bg-gray-900/40 hover:bg-gray-800/60 rounded-lg text-[12px] text-gray-300 transition-all duration-200"
              >
                <span className="font-medium">Output ({output.count} tweets)</span>
                {showOutput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                onClick={handleCopyOutput}
                className="px-3 py-2 bg-gray-900/40 hover:bg-gray-800/60 rounded-lg text-[12px] text-gray-300 transition-all duration-200 flex items-center gap-1.5"
                title="Copy JSON to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {showOutput && (
              <div className="nodrag nowheel mt-2 bg-gray-900/60 border border-gray-700/50 rounded-xl p-3 max-h-[200px] overflow-auto cursor-text select-text">
                <pre className="text-[10px] text-gray-400 whitespace-pre-wrap font-mono select-text">
                  {JSON.stringify(output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Connected Input Indicator */}
        {getInputFromConnections(id) !== undefined && (
          <div className="mt-2 text-[11px] text-blue-400 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Receiving input from connected node
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default memo(XSearchNode);
