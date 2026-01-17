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
  const [renderKey, setRenderKey] = useState(0);

  const stateRef = React.useRef<Map<number, unknown>>(new Map());
  const stateIndexRef = React.useRef(0);

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
        setRenderKey(k => k + 1);
      };
      return [value, setValue];
    };
  }, []);

  const renderedContent = useMemo(() => {
    setError(null);
    stateIndexRef.current = 0;

    console.log('[CodeRenderer] Rendering (key=' + renderKey + '):', code.substring(0, 100) + '...');

    try {
      const useState = createUseState();

      const wrappedCode = `
        try {
          return (${code});
        } catch (e) {
          console.error('[CodeRenderer] Runtime error:', e);
          return React.createElement('div', {
            style: { color: '#000000', padding: '20px', textAlign: 'center', border: '2px solid #000000' }
          }, 'RUNTIME ERROR: ' + e.message);
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
        background: '#ffffff',
      }}>
        <AlertCircle size={32} color="#000000" />
        <p style={{
          color: '#000000',
          marginTop: '12px',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
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
      background: '#ffffff',
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
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #000000',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{
            color: '#000000',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            LOADING...
          </span>
        </div>
      )}
      {error ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={32} color="#000000" />
          <span style={{
            color: '#000000',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            FAILED TO LOAD
          </span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt="Generated"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            border: '2px solid #000000',
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

const parseMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={index} style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#000000',
          marginTop: index > 0 ? '16px' : '0',
          marginBottom: '8px',
          textTransform: 'uppercase',
        }}>
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={index} style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#000000',
          marginTop: index > 0 ? '16px' : '0',
          marginBottom: '8px',
          textTransform: 'uppercase',
        }}>
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={index} style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#000000',
          marginTop: index > 0 ? '16px' : '0',
          marginBottom: '8px',
          textTransform: 'uppercase',
        }}>
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={index} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          marginBottom: '6px',
        }}>
          <span style={{ color: '#000000', fontWeight: 700, marginTop: '2px' }}>-</span>
          <span style={{ color: '#000000', fontSize: '12px', lineHeight: '1.5', flex: 1 }}>
            {formatInlineMarkdown(trimmed.slice(2))}
          </span>
        </div>
      );
    } else if (trimmed.match(/^\d+\.\s/)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '6px',
          }}>
            <span style={{ color: '#000000', fontWeight: 700, minWidth: '20px' }}>{match[1]}.</span>
            <span style={{ color: '#000000', fontSize: '12px', lineHeight: '1.5', flex: 1 }}>
              {formatInlineMarkdown(match[2])}
            </span>
          </div>
        );
      }
    } else if (trimmed === '') {
      elements.push(<div key={index} style={{ height: '8px' }} />);
    } else {
      elements.push(
        <p key={index} style={{
          color: '#000000',
          fontSize: '12px',
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

const formatInlineMarkdown = (text: string): React.ReactNode => {
  let remaining = text;

  const boldRegex = /\*\*(.+?)\*\*/g;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  const linkMap: { placeholder: string; text: string; url: string }[] = [];
  remaining = remaining.replace(linkRegex, (_, linkText, url) => {
    const placeholder = `__LINK_${linkMap.length}__`;
    linkMap.push({ placeholder, text: linkText, url });
    return placeholder;
  });

  const boldMap: { placeholder: string; text: string }[] = [];
  remaining = remaining.replace(boldRegex, (_, boldText) => {
    const placeholder = `__BOLD_${boldMap.length}__`;
    boldMap.push({ placeholder, text: boldText });
    return placeholder;
  });

  const allPlaceholders = [...linkMap.map(l => l.placeholder), ...boldMap.map(b => b.placeholder)];
  if (allPlaceholders.length === 0) {
    return text;
  }

  let result = remaining;
  linkMap.forEach(({ placeholder, text: linkText, url }) => {
    result = result.replace(placeholder, `<a href="${url}" style="color:#000000;text-decoration:underline;font-weight:700">${linkText}</a>`);
  });
  boldMap.forEach(({ placeholder, text: boldText }) => {
    result = result.replace(placeholder, `<strong>${boldText}</strong>`);
  });

  return <span dangerouslySetInnerHTML={{ __html: result }} />;
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
        <p style={{
          color: '#000000',
          textAlign: 'center',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          FAILED TO PARSE
        </p>
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
      background: '#ffffff',
    }}>
      {/* Header */}
      <div style={{
        background: '#000000',
        padding: '14px 18px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
        }}>
          <span style={{
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            WEB SEARCH
          </span>
        </div>
        <p style={{
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.4,
          textTransform: 'uppercase',
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
          border: '2px solid #000000',
          padding: '14px',
          marginBottom: '14px',
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
              background: '#000000',
            }} />
            <span style={{
              color: '#000000',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              ANSWER
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
                color: '#666666',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}>
                SOURCES
              </span>
              <div style={{
                background: '#000000',
                color: '#ffffff',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 700,
              }}>
                {sources.length}
              </div>
            </div>
            {sources.map((source, index) => (
              <div
                key={index}
                style={{
                  background: '#ffffff',
                  border: '2px solid #000000',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: '#000000',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: '#000000',
                    fontSize: '11px',
                    fontWeight: 700,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}>
                    {source.title || 'SOURCE'}
                  </p>
                  <p style={{
                    color: '#666666',
                    fontSize: '9px',
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
        borderTop: '2px solid #000000',
        background: '#ffffff',
        flexShrink: 0,
      }}>
        <p style={{
          color: '#666666',
          fontSize: '9px',
          textAlign: 'center',
          margin: 0,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          POWERED BY GROK
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
        <p style={{
          color: '#000000',
          textAlign: 'center',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          FAILED TO PARSE
        </p>
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
      background: '#ffffff',
    }}>
      {/* Header */}
      <div style={{
        background: '#000000',
        padding: '14px 18px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
        }}>
          <span style={{
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            DEEP RESEARCH
          </span>
          {reasoningTokens && (
            <div style={{
              marginLeft: 'auto',
              background: '#ffffff',
              color: '#000000',
              padding: '2px 8px',
              fontSize: '9px',
              fontWeight: 700,
            }}>
              {reasoningTokens.toLocaleString()} TOKENS
            </div>
          )}
        </div>
        <p style={{
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.4,
          textTransform: 'uppercase',
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
          border: '2px solid #000000',
          padding: '14px',
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
              background: '#000000',
            }} />
            <span style={{
              color: '#000000',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              ANALYSIS
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
        borderTop: '2px solid #000000',
        background: '#ffffff',
        flexShrink: 0,
      }}>
        <p style={{
          color: '#666666',
          fontSize: '9px',
          textAlign: 'center',
          margin: 0,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          POWERED BY GROK
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// X/Twitter Fetch Renderer Component
// ============================================================================

interface XFetchTweet {
  id: string;
  text: string;
  author: string;
  username: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
}

interface XFetchData {
  query: string;
  count: number;
  tweets: XFetchTweet[];
  searchedAt: string;
}

interface XFetchRendererProps {
  data: string;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'NOW';
  if (diffMins < 60) return `${diffMins}M`;
  if (diffHours < 24) return `${diffHours}H`;
  return `${diffDays}D`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const XFetchRenderer: React.FC<XFetchRendererProps> = ({ data }) => {
  let parsed: XFetchData;

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
        <p style={{
          color: '#000000',
          textAlign: 'center',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          FAILED TO PARSE
        </p>
      </div>
    );
  }

  const { query, count, tweets } = parsed;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#ffffff',
    }}>
      {/* Header */}
      <div style={{
        background: '#000000',
        padding: '14px 18px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
        }}>
          <span style={{
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            X SEARCH
          </span>
          <div style={{
            marginLeft: 'auto',
            background: '#ffffff',
            color: '#000000',
            padding: '2px 8px',
            fontSize: '9px',
            fontWeight: 700,
          }}>
            {count} POSTS
          </div>
        </div>
        <p style={{
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.4,
          textTransform: 'uppercase',
        }}>
          {query}
        </p>
      </div>

      {/* Tweets List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
      }}>
        {tweets.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
            <p style={{
              color: '#666666',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              NO POSTS FOUND
            </p>
          </div>
        ) : (
          tweets.map((tweet, index) => (
            <div
              key={tweet.id}
              style={{
                background: '#ffffff',
                border: '2px solid #000000',
                padding: '12px',
                marginBottom: index < tweets.length - 1 ? '8px' : 0,
              }}
            >
              {/* Tweet Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: '#000000',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {tweet.author.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: '#000000',
                    fontSize: '11px',
                    fontWeight: 700,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}>
                    {tweet.author}
                  </p>
                  <p style={{
                    color: '#666666',
                    fontSize: '9px',
                    margin: 0,
                    fontWeight: 600,
                  }}>
                    @{tweet.username}
                  </p>
                </div>
                <span style={{
                  color: '#666666',
                  fontSize: '9px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {formatTimeAgo(tweet.createdAt)}
                </span>
              </div>

              {/* Tweet Text */}
              <p style={{
                color: '#000000',
                fontSize: '11px',
                lineHeight: 1.5,
                margin: '0 0 10px 0',
                wordBreak: 'break-word',
              }}>
                {tweet.text}
              </p>

              {/* Tweet Stats */}
              <div style={{
                display: 'flex',
                gap: '16px',
                borderTop: '1px solid #e0e0e0',
                paddingTop: '8px',
              }}>
                <span style={{
                  color: '#666666',
                  fontSize: '9px',
                  fontWeight: 700,
                }}>
                  ♡ {formatNumber(tweet.likes)}
                </span>
                <span style={{
                  color: '#666666',
                  fontSize: '9px',
                  fontWeight: 700,
                }}>
                  ↻ {formatNumber(tweet.retweets)}
                </span>
                <span style={{
                  color: '#666666',
                  fontSize: '9px',
                  fontWeight: 700,
                }}>
                  💬 {formatNumber(tweet.replies)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '2px solid #000000',
        background: '#ffffff',
        flexShrink: 0,
      }}>
        <p style={{
          color: '#666666',
          fontSize: '9px',
          textAlign: 'center',
          margin: 0,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          POWERED BY X API
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
        color: '#000000',
        fontSize: '48px',
        fontWeight: 900,
        marginBottom: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      0
    </div>
    <p style={{
      color: '#666666',
      fontSize: '12px',
      marginBottom: '24px',
      textTransform: 'uppercase',
      fontWeight: 700,
      letterSpacing: '0.5px',
    }}>
      TAP THE BUTTON TO START
    </p>
    <button
      style={{
        background: '#000000',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: '12px',
        padding: '12px 24px',
        border: '3px solid #000000',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '1px',
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
      {/* Connection Handles - Brutalist square */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          width: '12px',
          height: '12px',
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 0,
          top: -6,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          width: '12px',
          height: '12px',
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 0,
          left: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          width: '12px',
          height: '12px',
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 0,
          right: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          width: '12px',
          height: '12px',
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 0,
          bottom: -6,
        }}
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
              style={{
                background: '#ffffff',
                color: '#000000',
                fontSize: '12px',
                fontWeight: 700,
                border: '2px solid #000000',
                padding: '4px 8px',
                textTransform: 'uppercase',
                width: '120px',
              }}
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-1.5 cursor-pointer group/title"
              onClick={() => setIsEditingTitle(true)}
            >
              <span style={{
                color: '#000000',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {nodeData.title}
              </span>
              <Pencil size={12} className="text-gray-500 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Right: Control buttons */}
        <div className="flex items-center gap-0">
          <div
            className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center transition-colors"
            title="Drag to move"
            style={{
              width: '28px',
              height: '28px',
              background: '#ffffff',
              border: '2px solid #000000',
              color: '#000000',
            }}
          >
            <GripHorizontal size={14} />
          </div>
          <button
            onClick={() => removeBlock(id)}
            className="flex items-center justify-center transition-colors"
            title="Delete"
            style={{
              width: '28px',
              height: '28px',
              background: '#000000',
              border: '2px solid #000000',
              color: '#ffffff',
              marginLeft: '-2px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Phone Frame - Brutalist */}
      <div
        className="relative p-3"
        style={{
          backgroundColor: '#000000',
          border: '3px solid #000000',
        }}
      >
        {/* Notch/Speaker at top */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
          style={{
            width: '60px',
            height: '6px',
            background: '#ffffff',
          }}
        />

        {/* Phone Screen */}
        <div
          className="relative overflow-hidden"
          style={{
            height: nodeData.size.height - 24,
            backgroundColor: '#ffffff',
            border: '2px solid #000000',
          }}
        >
          {/* Screen Content Container */}
          <div className="h-full flex flex-col">
            {/* Status Bar - Brutalist */}
            <div
              className="flex items-center justify-between px-5 pt-3 pb-1"
              style={{ background: '#000000' }}
            >
              <span style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
              }}>
                9:41
              </span>
              <div className="flex items-center gap-1">
                <Signal size={12} color="#ffffff" />
                <Wifi size={12} color="#ffffff" />
                <Battery size={14} color="#ffffff" />
              </div>
            </div>

            {/* App Header Bar */}
            <div style={{ background: '#000000', padding: '12px 20px' }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: 0,
              }}>
                {nodeData.title}
              </h2>
            </div>

            {/* App Content Area */}
            <div
              className="flex-1 overflow-auto"
              style={{ background: '#ffffff' }}
            >
              {nodeData.isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #000000',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <span style={{
                    color: '#000000',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {nodeData.contentType === 'code' ? 'GENERATING APP...' :
                     nodeData.contentType === 'image' ? 'CREATING IMAGE...' :
                     nodeData.contentType === 'webSearch' ? 'SEARCHING WEB...' :
                     nodeData.contentType === 'reasoning' ? 'RESEARCHING...' :
                     nodeData.contentType === 'xFetch' ? 'SEARCHING X...' :
                     'LOADING...'}
                  </span>
                </div>
              ) : nodeData.error ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 px-4">
                  <AlertCircle size={32} color="#000000" />
                  <p style={{
                    color: '#000000',
                    fontSize: '11px',
                    textAlign: 'center',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    {nodeData.error}
                  </p>
                </div>
              ) : nodeData.contentType === 'webSearch' && nodeData.content ? (
                <div className="h-full">
                  <WebSearchRenderer data={nodeData.content} />
                </div>
              ) : nodeData.contentType === 'reasoning' && nodeData.content ? (
                <div className="h-full">
                  <ReasoningRenderer data={nodeData.content} />
                </div>
              ) : nodeData.contentType === 'xFetch' && nodeData.content ? (
                <div className="h-full">
                  <XFetchRenderer data={nodeData.content} />
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

            {/* Home Indicator - Brutalist */}
            <div style={{ background: '#ffffff', padding: '12px 0' }} className="flex justify-center">
              <div style={{
                width: '100px',
                height: '4px',
                background: '#000000',
              }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(PhoneNode);
