import React, { memo, useState, useMemo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  Pencil,
  X,
  GripHorizontal,
  Wifi,
  Battery,
  Signal,
  AlertCircle,
} from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import type { PhoneBlock } from '../../types/canvas';

// ============================================================================
// Dynamic Code Renderer Component
// ============================================================================

interface CodeRendererProps {
  code: string;
}

const CodeRenderer: React.FC<CodeRendererProps> = ({ code }) => {
  const [error, setError] = useState<string | null>(null);
  // Use state value (not just setter) to trigger re-renders
  const [renderKey, setRenderKey] = useState(0);

  // Store for component state (simulated React state)
  const stateRef = React.useRef<Map<number, unknown>>(new Map());
  const stateIndexRef = React.useRef(0);

  // Simple useState implementation for the rendered code
  const createUseState = React.useCallback(() => {
    return <T,>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] => {
      const index = stateIndexRef.current++;
      if (!stateRef.current.has(index)) {
        stateRef.current.set(index, initialValue);
      }
      const value = stateRef.current.get(index) as T;
      const setValue = (newValue: T | ((prev: T) => T)) => {
        const current = stateRef.current.get(index) as T;
        const next = typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(current)
          : newValue;
        stateRef.current.set(index, next);
        // Trigger re-render by updating renderKey
        setRenderKey(k => k + 1);
      };
      return [value, setValue];
    };
  }, []);

  const renderedContent = useMemo(() => {
    setError(null);
    stateIndexRef.current = 0; // Reset state index for re-render

    console.log('[CodeRenderer] Rendering (key=' + renderKey + '):', code.substring(0, 100) + '...');

    try {
      // Create a sandboxed React context
      const useState = createUseState();

      // Wrap the code in a function that returns React elements
      const wrappedCode = `
        try {
          return (${code});
        } catch (e) {
          console.error('[CodeRenderer] Runtime error:', e);
          return React.createElement('div', {
            style: { color: 'red', padding: '20px', textAlign: 'center' }
          }, 'Runtime Error: ' + e.message);
        }
      `;

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const renderFn = new Function('React', 'useState', wrappedCode);
      const result = renderFn(React, useState);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to render';
      console.error('[CodeRenderer] Parse/Compile error:', message);
      console.error('[CodeRenderer] Code that failed:', code);
      setError(message);
      return null;
    }
  }, [code, renderKey, createUseState]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px',
        background: '#fef2f2',
      }}>
        <AlertCircle size={32} color="#ef4444" />
        <p style={{ color: '#ef4444', marginTop: '12px', textAlign: 'center', fontSize: '14px' }}>
          {error}
        </p>
      </div>
    );
  }

  return <>{renderedContent}</>;
};

// ============================================================================
// Image Renderer Component
// ============================================================================

interface ImageRendererProps {
  imageUrl: string;
}

const ImageRenderer: React.FC<ImageRendererProps> = ({ imageUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      background: '#f8fafc',
      padding: '16px',
    }}>
      {loading && !error && (
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span style={{ color: '#6b7280', fontSize: '12px' }}>Loading image...</span>
        </div>
      )}
      {error ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={32} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: '12px' }}>Failed to load image</span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt="Generated"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: loading ? 'none' : 'block',
          }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// Web Search Renderer Component
// ============================================================================

interface WebSearchData {
  query: string;
  answer: string;
  sources: { title: string; url: string }[];
}

interface WebSearchRendererProps {
  data: string;
}

// Simple markdown parser for basic formatting
const parseMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={index} style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#0f172a',
          marginTop: index > 0 ? '16px' : '0',
          marginBottom: '8px',
        }}>
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={index} style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#0f172a',
          marginTop: index > 0 ? '16px' : '0',
          marginBottom: '8px',
        }}>
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={index} style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#0f172a',
          marginTop: index > 0 ? '16px' : '0',
          marginBottom: '8px',
        }}>
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet points
      elements.push(
        <div key={index} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          marginBottom: '6px',
        }}>
          <span style={{ color: '#3b82f6', fontWeight: '700', marginTop: '2px' }}>•</span>
          <span style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5', flex: 1 }}>
            {formatInlineMarkdown(trimmed.slice(2))}
          </span>
        </div>
      );
    } else if (trimmed.match(/^\d+\.\s/)) {
      // Numbered lists
      const match = trimmed.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '6px',
          }}>
            <span style={{ color: '#3b82f6', fontWeight: '600', minWidth: '20px' }}>{match[1]}.</span>
            <span style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5', flex: 1 }}>
              {formatInlineMarkdown(match[2])}
            </span>
          </div>
        );
      }
    } else if (trimmed === '') {
      elements.push(<div key={index} style={{ height: '8px' }} />);
    } else {
      // Regular paragraph
      elements.push(
        <p key={index} style={{
          color: '#334155',
          fontSize: '14px',
          lineHeight: '1.6',
          marginBottom: '8px',
        }}>
          {formatInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  return elements;
};

// Format inline markdown (bold, italic, links)
const formatInlineMarkdown = (text: string): React.ReactNode => {
  let remaining = text;

  // Simple regex-based parsing
  const boldRegex = /\*\*(.+?)\*\*/g;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // First, replace links with placeholders
  const linkMap: { placeholder: string; text: string; url: string }[] = [];
  remaining = remaining.replace(linkRegex, (_, linkText, url) => {
    const placeholder = `__LINK_${linkMap.length}__`;
    linkMap.push({ placeholder, text: linkText, url });
    return placeholder;
  });

  // Then, replace bold with placeholders
  const boldMap: { placeholder: string; text: string }[] = [];
  remaining = remaining.replace(boldRegex, (_, boldText) => {
    const placeholder = `__BOLD_${boldMap.length}__`;
    boldMap.push({ placeholder, text: boldText });
    return placeholder;
  });

  // Split by placeholders and reconstruct
  const allPlaceholders = [...linkMap.map(l => l.placeholder), ...boldMap.map(b => b.placeholder)];
  if (allPlaceholders.length === 0) {
    return text;
  }

  // Simple split approach
  let result = remaining;
  linkMap.forEach(({ placeholder, text: linkText, url }) => {
    result = result.replace(placeholder, `<a href="${url}">${linkText}</a>`);
  });
  boldMap.forEach(({ placeholder, text: boldText }) => {
    result = result.replace(placeholder, `<strong>${boldText}</strong>`);
  });

  // Return as dangerouslySetInnerHTML for simplicity
  return <span dangerouslySetInnerHTML={{ __html: result }} style={{
    // Style for links
  }} />;
};

const WebSearchRenderer: React.FC<WebSearchRendererProps> = ({ data }) => {
  let parsed: WebSearchData;

  try {
    parsed = JSON.parse(data);
  } catch {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px',
      }}>
        <p style={{ color: '#ef4444', textAlign: 'center' }}>Failed to parse search results</p>
      </div>
    );
  }

  const { query, answer, sources } = parsed;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#f8fafc',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        padding: '14px 18px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
          }}>
            🔍
          </div>
          <span style={{
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '500',
            opacity: 0.9,
          }}>
            Web Search
          </span>
        </div>
        <p style={{
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '600',
          margin: 0,
          lineHeight: 1.4,
        }}>
          {query}
        </p>
      </div>

      {/* Results Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 16px',
      }}>
        {/* Answer Section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
            }} />
            <span style={{
              color: '#0f172a',
              fontSize: '14px',
              fontWeight: '600',
            }}>
              Answer
            </span>
          </div>
          <div>
            {parseMarkdown(answer)}
          </div>
        </div>

        {/* Sources Section */}
        {sources && sources.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}>
              <span style={{
                color: '#64748b',
                fontSize: '12px',
                fontWeight: '600',
              }}>
                Sources
              </span>
              <div style={{
                background: '#e2e8f0',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '10px',
                color: '#64748b',
                fontWeight: '500',
              }}>
                {sources.length}
              </div>
            </div>
            {sources.map((source, index) => (
              <div
                key={index}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  flexShrink: 0,
                }}>
                  📄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: '500',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {source.title || 'Source'}
                  </p>
                  <p style={{
                    color: '#64748b',
                    fontSize: '10px',
                    margin: '2px 0 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {source.url?.replace(/^https?:\/\//, '').split('/')[0] || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        flexShrink: 0,
      }}>
        <p style={{
          color: '#94a3b8',
          fontSize: '10px',
          textAlign: 'center',
          margin: 0,
        }}>
          Powered by Grok Web Search
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Reasoning/Deep Research Renderer Component
// ============================================================================

interface ReasoningData {
  query: string;
  answer: string;
  reasoningTokens?: number;
  model: string;
}

interface ReasoningRendererProps {
  data: string;
}

const ReasoningRenderer: React.FC<ReasoningRendererProps> = ({ data }) => {
  let parsed: ReasoningData;

  try {
    parsed = JSON.parse(data);
  } catch {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px',
      }}>
        <p style={{ color: '#ef4444', textAlign: 'center' }}>Failed to parse research results</p>
      </div>
    );
  }

  const { query, answer, reasoningTokens } = parsed;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#f8fafc',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        padding: '14px 18px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
          }}>
            🧠
          </div>
          <span style={{
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '500',
            opacity: 0.9,
          }}>
            Deep Research
          </span>
          {reasoningTokens && (
            <div style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '10px',
              color: '#ffffff',
              fontWeight: '500',
            }}>
              {reasoningTokens.toLocaleString()} tokens
            </div>
          )}
        </div>
        <p style={{
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '600',
          margin: 0,
          lineHeight: 1.4,
        }}>
          {query}
        </p>
      </div>

      {/* Results Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 16px',
      }}>
        {/* Analysis Section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#8b5cf6',
            }} />
            <span style={{
              color: '#0f172a',
              fontSize: '14px',
              fontWeight: '600',
            }}>
              Analysis
            </span>
          </div>
          <div>
            {parseMarkdown(answer)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        flexShrink: 0,
      }}>
        <p style={{
          color: '#94a3b8',
          fontSize: '10px',
          textAlign: 'center',
          margin: 0,
        }}>
          Powered by Grok Deep Research
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Default Content Component
// ============================================================================

const DefaultContent: React.FC = () => (
  <>
    <div
      style={{
        color: '#4CAF50',
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      0
    </div>
    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
      Tap the button to start!
    </p>
    <button
      style={{
        background: '#4CAF50',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
        padding: '12px 24px',
        borderRadius: '9999px',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 8px 20px -4px rgba(76, 175, 80, 0.5)',
      }}
    >
      TAP ME
    </button>
  </>
);

const PhoneNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as PhoneBlock;
  const updateBlock = useCanvasStore((s) => s.updateBlock);
  const removeBlock = useCanvasStore((s) => s.removeBlock);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(nodeData.title);

  const handleTitleSave = () => {
    updateBlock(id, { title: titleValue });
    setIsEditingTitle(false);
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="relative group"
      style={{ width: nodeData.size.width }}
    >
      {/* Connection Handles - Outside on all sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3.5 !h-3.5 !border-2 !border-[#0a0f1a] transition-all hover:!scale-125 !bg-blue-500 !rounded-full"
        style={{ top: -7 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3.5 !h-3.5 !border-2 !border-[#0a0f1a] transition-all hover:!scale-125 !bg-blue-500 !rounded-full"
        style={{ left: -7 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3.5 !h-3.5 !border-2 !border-[#0a0f1a] transition-all hover:!scale-125 !bg-blue-500 !rounded-full"
        style={{ right: -7 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3.5 !h-3.5 !border-2 !border-[#0a0f1a] transition-all hover:!scale-125 !bg-blue-500 !rounded-full"
        style={{ bottom: -7 }}
      />

      {/* Header - Above Phone */}
      <div className="absolute -top-10 left-0 right-0 flex items-center justify-between px-2 z-10">
        {/* Left: Title with edit */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="bg-transparent text-white text-sm font-medium border-b border-blue-500 focus:outline-none w-32"
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-1.5 cursor-pointer group/title"
              onClick={() => setIsEditingTitle(true)}
            >
              <span className="text-white text-sm font-medium group-hover/title:text-blue-400 transition-colors">
                {nodeData.title}
              </span>
              <Pencil size={12} className="text-gray-500 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Right: Control buttons */}
        <div className="flex items-center gap-0.5">
          <div
            className="drag-handle cursor-grab active:cursor-grabbing p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Drag to move"
          >
            <GripHorizontal size={14} />
          </div>
          <button
            onClick={() => removeBlock(id)}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            title="Delete"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Phone Frame - Dark bezel */}
      <div
        className="relative rounded-[2.5rem] p-3"
        style={{
          backgroundColor: '#1e2432',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)'
        }}
      >
        {/* Notch/Speaker at top */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-[#0a0f1a] rounded-full z-20" />

        {/* Phone Screen */}
        <div
          className="relative rounded-[1.75rem] overflow-hidden"
          style={{
            height: nodeData.size.height - 24,
            backgroundColor: '#000'
          }}
        >
          {/* Screen Content Container */}
          <div className="h-full flex flex-col">
            {/* iOS-style Status Bar - inside screen */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1 bg-[#4A90D9]">
              <span className="text-white text-[12px] font-semibold">9:41</span>
              <div className="flex items-center gap-1">
                <Signal size={12} className="text-white" />
                <Wifi size={12} className="text-white" />
                <Battery size={14} className="text-white" />
              </div>
            </div>

            {/* App Header Bar */}
            <div className="bg-[#4A90D9] px-5 py-3">
              <h2 className="text-white text-lg font-bold text-center tracking-tight">
                {nodeData.title}
              </h2>
            </div>

            {/* App Content Area */}
            <div
              className="flex-1 overflow-auto"
              style={{
                background: nodeData.contentType === 'default'
                  ? 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
                  : '#f8fafc'
              }}
            >
              {nodeData.isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-500 text-sm font-medium">
                    {nodeData.contentType === 'code' ? 'Generating app...' :
                     nodeData.contentType === 'image' ? 'Creating image...' :
                     nodeData.contentType === 'webSearch' ? 'Searching the web...' :
                     nodeData.contentType === 'reasoning' ? 'Researching deeply...' :
                     'Loading...'}
                  </span>
                </div>
              ) : nodeData.error ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 px-4">
                  <AlertCircle size={32} color="#ef4444" />
                  <p className="text-red-500 text-sm text-center">{nodeData.error}</p>
                </div>
              ) : nodeData.contentType === 'webSearch' && nodeData.content ? (
                <div className="h-full">
                  <WebSearchRenderer data={nodeData.content} />
                </div>
              ) : nodeData.contentType === 'reasoning' && nodeData.content ? (
                <div className="h-full">
                  <ReasoningRenderer data={nodeData.content} />
                </div>
              ) : nodeData.contentType === 'code' && nodeData.content ? (
                <div className="h-full">
                  <CodeRenderer code={nodeData.content} />
                </div>
              ) : nodeData.contentType === 'image' && nodeData.content ? (
                <ImageRenderer imageUrl={nodeData.content} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center px-6">
                  <DefaultContent />
                </div>
              )}
            </div>

            {/* Home Indicator */}
            <div className="bg-[#f1f5f9] py-3 flex justify-center">
              <div className="w-28 h-1 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(PhoneNode);
