/**
 * Workflow Executor
 *
 * Traverses node connections and executes the appropriate pipeline.
 * Supports flows like: Chat → Code → Phone, Chat → Image → Phone
 */

import { llmRouter } from './llmRouter';
import { grokApi } from './grokApi';
import { searchTweets, type Tweet } from '../api/twitter';
import type { GrokBlock, Connection, PhoneContentType } from '../types/canvas';

// ============================================================================
// Types
// ============================================================================

export interface WorkflowResult {
  success: boolean;
  contentType: PhoneContentType;
  content: string;
  error?: string;
}

export interface WorkflowPath {
  sourceNode: GrokBlock;
  processingNodes: GrokBlock[];
  targetNode: GrokBlock | null;
}

type NodeType = GrokBlock['type'];

// Processing node types that transform input before reaching output
const PROCESSING_NODE_TYPES: NodeType[] = [
  'codeExecution',
  'vision',
  'imageInput', // For image generation workflows
  'reasoning',
  'webSearch',
  'xFetch',
  'xDM',
];

// Output node types
const OUTPUT_NODE_TYPES: NodeType[] = ['phone', 'output'];

// ============================================================================
// Workflow Path Finding
// ============================================================================

/**
 * Find all nodes connected downstream from a source node
 */
export function findWorkflowPath(
  sourceId: string,
  blocks: GrokBlock[],
  connections: Connection[]
): WorkflowPath {
  const blockMap = new Map(blocks.map((b) => [b.id, b]));
  const sourceNode = blockMap.get(sourceId);

  console.log('[findWorkflowPath] Starting from source:', sourceId);
  console.log('[findWorkflowPath] Available connections:', connections.map(c => `${c.source} -> ${c.target}`));

  if (!sourceNode) {
    console.log('[findWorkflowPath] Source node not found!');
    return { sourceNode: sourceNode!, processingNodes: [], targetNode: null };
  }

  const processingNodes: GrokBlock[] = [];
  let targetNode: GrokBlock | null = null;
  const visited = new Set<string>();

  // BFS to find path from source to output
  const queue: string[] = [sourceId];
  visited.add(sourceId);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentNode = blockMap.get(currentId);

    if (!currentNode) continue;

    // Find all connections where current node is the source
    const outgoingConnections = connections.filter((c) => c.source === currentId);
    console.log(`[findWorkflowPath] From ${currentId} (${currentNode.type}), found ${outgoingConnections.length} outgoing connections`);

    for (const conn of outgoingConnections) {
      console.log(`[findWorkflowPath] Checking connection to: ${conn.target}`);

      if (visited.has(conn.target)) {
        console.log(`[findWorkflowPath] Already visited ${conn.target}, skipping`);
        continue;
      }
      visited.add(conn.target);

      const nextNode = blockMap.get(conn.target);
      if (!nextNode) {
        console.log(`[findWorkflowPath] Node ${conn.target} not found in blocks`);
        continue;
      }

      console.log(`[findWorkflowPath] Next node type: ${nextNode.type}`);

      if (OUTPUT_NODE_TYPES.includes(nextNode.type)) {
        console.log(`[findWorkflowPath] Found OUTPUT node: ${nextNode.type}`);
        targetNode = nextNode;
      } else if (PROCESSING_NODE_TYPES.includes(nextNode.type)) {
        console.log(`[findWorkflowPath] Found PROCESSING node: ${nextNode.type}`);
        processingNodes.push(nextNode);
        queue.push(conn.target);
      } else {
        console.log(`[findWorkflowPath] Found OTHER node: ${nextNode.type}, continuing traversal`);
        // Other nodes (like another textCompletion) - continue traversing
        queue.push(conn.target);
      }
    }
  }

  console.log('[findWorkflowPath] Final result:', {
    processingNodes: processingNodes.map(n => n.type),
    targetNode: targetNode?.type,
  });

  return { sourceNode, processingNodes, targetNode };
}

/**
 * Check if a chat node is connected to a phone via processing nodes
 */
export function getWorkflowType(
  sourceId: string,
  blocks: GrokBlock[],
  connections: Connection[]
): { hasWorkflow: boolean; processingType: NodeType | null; targetId: string | null; processingNode: GrokBlock | null } {
  console.log('[getWorkflowType] Checking workflow for source:', sourceId);
  console.log('[getWorkflowType] Total blocks:', blocks.length, 'Total connections:', connections.length);

  const path = findWorkflowPath(sourceId, blocks, connections);

  console.log('[getWorkflowType] Found path:', {
    sourceNode: path.sourceNode?.type,
    processingNodes: path.processingNodes.map(n => n.type),
    targetNode: path.targetNode?.type,
  });

  if (!path.targetNode || path.targetNode.type !== 'phone') {
    console.log('[getWorkflowType] No phone target found');
    return { hasWorkflow: false, processingType: null, targetId: null, processingNode: null };
  }

  // Get the first processing node (determines the workflow type)
  const processingNode = path.processingNodes.length > 0
    ? path.processingNodes[0]
    : null;
  const processingType = processingNode?.type || null;

  console.log('[getWorkflowType] Workflow detected:', { processingType, targetId: path.targetNode.id });

  return {
    hasWorkflow: true,
    processingType,
    targetId: path.targetNode.id,
    processingNode,
  };
}

// ============================================================================
// Workflow Execution
// ============================================================================

/**
 * Execute a code generation workflow
 * Chat message → Generate React code → Return for Phone rendering
 */
async function executeCodeWorkflow(userMessage: string): Promise<WorkflowResult> {
  const systemPrompt = `You are a world-class React developer and UI/UX designer. Generate stunning, premium mobile app interfaces using React.createElement() syntax (NOT JSX).

CRITICAL TECHNICAL RULES:
1. Use React.createElement() syntax ONLY - absolutely NO JSX (<div>, <span>, etc.)
2. Return a SINGLE self-executing function that returns React.createElement()
3. Use inline styles as JavaScript objects
4. Design for mobile (320px width, ~400px height)
5. For state, use: useState(initialValue) - it's provided as a parameter
6. Use function() {} syntax for event handlers (NOT arrow functions in JSX attributes)

=== COLOR CONTRAST & ACCESSIBILITY (CRITICAL) ===

WCAG CONTRAST REQUIREMENTS - FOLLOW STRICTLY:
- Normal text (< 18px): Minimum 4.5:1 contrast ratio
- Large text (≥ 18px bold or ≥ 24px): Minimum 3:1 contrast ratio
- UI components & graphical objects: Minimum 3:1 contrast ratio

LIGHT BACKGROUNDS - Use dark text:
- White/Light gray (#ffffff, #f8fafc, #f1f5f9): Use text #1e293b, #0f172a, or #18181b
- Light colored backgrounds (#e0f2fe, #fef3c7, #f3e8ff): Use text #1e293b or darker
- NEVER use light gray text (#9ca3af, #d1d5db) on light backgrounds

DARK BACKGROUNDS - Use light text:
- Dark backgrounds (#1e293b, #0f172a, #18181b): Use text #f8fafc, #e2e8f0, or white
- Colored dark backgrounds: Use white or very light text
- NEVER use dark text on dark backgrounds

PLACEHOLDER/HINT TEXT:
- Light backgrounds: Use #64748b or #6b7280 (medium gray - NOT too light)
- Dark backgrounds: Use #94a3b8 or #9ca3af (lighter gray)
- Placeholders must be clearly visible but distinguishable from input text

INPUT FIELDS:
- Background: #ffffff (white) for light themes, #1f2937 for dark themes
- Text color: #1e293b (dark) on white, #f8fafc (light) on dark
- Placeholder: #64748b on white, #9ca3af on dark
- Border: #d1d5db on light, #4b5563 on dark
- Focus border: Use primary color (#3b82f6)

BUTTONS:
- Primary (blue #3b82f6): White text (#ffffff)
- Danger (red #ef4444): White text (#ffffff)
- Success (green #10b981): White text (#ffffff)
- Warning (amber #f59e0b): Dark text (#18181b)
- Light buttons: Dark text (#1e293b)

=== DESIGN LAWS & PRINCIPLES ===

1. VISUAL HIERARCHY (F-Pattern & Z-Pattern):
   - Most important elements: larger, bolder, higher contrast
   - Primary actions: prominent color, larger touch targets (min 44px)
   - Secondary info: smaller, lighter (but still readable!)
   - Guide the eye with size, weight, color, and spacing

2. GESTALT PRINCIPLES:
   - Proximity: Group related items together (8-12px gap within groups, 20-32px between groups)
   - Similarity: Same style for same function (all buttons look like buttons)
   - Closure: Complete shapes and containers
   - Continuity: Align elements on a grid

3. WHITESPACE (Critical for Premium Feel):
   - Container padding: 20-24px
   - Between sections: 24-32px
   - Between list items: 12-16px
   - Inside cards: 16-20px
   - Don't crowd elements - let them breathe

4. TYPOGRAPHY HIERARCHY:
   - Page title: 24-28px, fontWeight 700, color high contrast
   - Section headers: 18-20px, fontWeight 600
   - Body text: 14-16px, fontWeight 400, lineHeight 1.5
   - Caption/helper: 12-13px, fontWeight 400, slightly muted

5. COLOR HARMONY:
   - Use max 2-3 primary colors + neutrals
   - 60-30-10 rule: 60% dominant, 30% secondary, 10% accent
   - Consistent color meanings (red=danger, green=success, blue=primary)

=== PREMIUM DESIGN TOKENS ===

BACKGROUNDS:
- Light theme: #ffffff, #f8fafc, #f1f5f9
- Dark theme: #0f172a, #1e293b, #334155
- Cards on light: #ffffff with shadow
- Cards on dark: #1e293b or rgba(255,255,255,0.05)

TEXT COLORS (Always ensure contrast!):
- Primary text (light bg): #0f172a or #1e293b
- Primary text (dark bg): #f8fafc or #e2e8f0
- Secondary text (light bg): #475569 or #64748b
- Secondary text (dark bg): #94a3b8 or #cbd5e1
- Muted/disabled: #9ca3af (use sparingly, ensure readability)

ACCENT COLORS:
- Blue: #3b82f6 (primary actions)
- Purple: #8b5cf6 (creative/premium)
- Green: #10b981 (success/positive)
- Red: #ef4444 (danger/delete)
- Amber: #f59e0b (warning)

SHADOWS (Light themes only, subtle on dark):
- Cards: '0 4px 20px rgba(0,0,0,0.08)'
- Elevated: '0 10px 40px rgba(0,0,0,0.12)'
- Buttons: '0 4px 14px rgba(COLOR,0.3)' matching button color

BORDERS & RADIUS:
- Inputs/buttons: 10-12px
- Cards: 16-20px
- Pills/badges: 9999px
- Border colors: #e2e8f0 (light), #334155 (dark)

=== INTERACTIVITY (MUST WORK) ===

- Every button must have onClick handler
- Every input must have value and onChange
- Lists must support add/remove/toggle
- Forms must update state properly
- Use function() {} syntax for handlers

=== SYNTAX REFERENCE ===

React.createElement(type, props, ...children)
- type: 'div', 'button', 'span', 'input', etc.
- props: { style: {...}, onClick: function(){}, value: stateVar } or null
- children: strings, other createElement calls, or arrays

=== EXAMPLE - PREMIUM TODO APP ===

(function() {
  var _todosState = useState([{id: 1, text: 'Learn React', done: false}, {id: 2, text: 'Build app', done: true}]);
  var todos = _todosState[0];
  var setTodos = _todosState[1];

  var _inputState = useState('');
  var inputVal = _inputState[0];
  var setInputVal = _inputState[1];

  function addTodo() {
    if (inputVal.trim()) {
      setTodos(todos.concat([{id: Date.now(), text: inputVal.trim(), done: false}]));
      setInputVal('');
    }
  }

  function toggleTodo(id) {
    setTodos(todos.map(function(t) { return t.id === id ? {id: t.id, text: t.text, done: !t.done} : t; }));
  }

  function deleteTodo(id) {
    setTodos(todos.filter(function(t) { return t.id !== id; }));
  }

  return React.createElement('div', {
    style: {
      height: '100%',
      background: '#f8fafc',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column'
    }
  },
    React.createElement('h1', {
      style: {
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: '24px',
        textAlign: 'center'
      }
    }, 'My Tasks'),
    React.createElement('div', {
      style: { display: 'flex', gap: '10px', marginBottom: '24px' }
    },
      React.createElement('input', {
        type: 'text',
        value: inputVal,
        onChange: function(e) { setInputVal(e.target.value); },
        onKeyDown: function(e) { if (e.key === 'Enter') addTodo(); },
        placeholder: 'What needs to be done?',
        style: {
          flex: 1,
          padding: '14px 18px',
          borderRadius: '12px',
          border: '2px solid #e2e8f0',
          fontSize: '15px',
          color: '#1e293b',
          background: '#ffffff',
          outline: 'none'
        }
      }),
      React.createElement('button', {
        onClick: addTodo,
        style: {
          padding: '14px 22px',
          borderRadius: '12px',
          background: '#3b82f6',
          color: '#ffffff',
          border: 'none',
          fontWeight: '600',
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(59,130,246,0.35)'
        }
      }, '+')
    ),
    React.createElement('div', {
      style: { flex: 1, overflowY: 'auto' }
    },
      todos.length === 0
        ? React.createElement('p', {
            style: { color: '#64748b', textAlign: 'center', marginTop: '40px', fontSize: '15px' }
          }, 'No tasks yet. Add one above!')
        : todos.map(function(todo) {
            return React.createElement('div', {
              key: todo.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 18px',
                background: '#ffffff',
                borderRadius: '14px',
                marginBottom: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }
            },
              React.createElement('div', {
                onClick: function() { toggleTodo(todo.id); },
                style: {
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  border: todo.done ? 'none' : '2px solid #cbd5e1',
                  background: todo.done ? '#3b82f6' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                  flexShrink: 0
                }
              }, todo.done ? '✓' : ''),
              React.createElement('span', {
                style: {
                  flex: 1,
                  fontSize: '15px',
                  color: todo.done ? '#94a3b8' : '#1e293b',
                  textDecoration: todo.done ? 'line-through' : 'none'
                }
              }, todo.text),
              React.createElement('button', {
                onClick: function() { deleteTodo(todo.id); },
                style: {
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  color: '#ef4444',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '500'
                }
              }, '×')
            );
          })
    )
  );
})()

=== OUTPUT RULES ===

- Return ONLY the React.createElement code wrapped in (function() { ... })()
- Do NOT wrap in markdown code blocks
- Do NOT use JSX syntax
- No explanations outside the code
- Ensure all brackets/parentheses are balanced
- Use function() {} for event handlers
- Use .concat(), .map(), .filter() for arrays

Generate the app for: ${userMessage}`;

  try {
    console.log('[WorkflowExecutor] Starting code generation for:', userMessage);

    const response = await llmRouter.chat({
      messages: [{ role: 'user', content: userMessage }],
      systemPrompt,
      model: 'grok-4-latest',
      temperature: 0.5, // Lower temperature for more consistent code
    });

    if (!response.success || !response.data) {
      console.error('[WorkflowExecutor] API call failed:', response.error);
      return {
        success: false,
        contentType: 'code',
        content: '',
        error: response.error || 'Failed to generate code',
      };
    }

    // Extract code from response (handle markdown code blocks)
    let code = response.data.content;
    console.log('[WorkflowExecutor] Raw LLM response:', code.substring(0, 500) + '...');

    // Remove markdown code blocks if present
    const codeBlockMatch = code.match(/```(?:jsx?|tsx?|javascript|js)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1].trim();
      console.log('[WorkflowExecutor] Extracted from code block');
    }

    // Clean up any leading/trailing whitespace
    code = code.trim();

    // Check if it still contains JSX (common LLM mistake)
    if (code.includes('<div') || code.includes('<span') || code.includes('<button')) {
      console.warn('[WorkflowExecutor] Warning: Response contains JSX syntax, this may fail to render');
    }

    console.log('[WorkflowExecutor] Final code to render:', code.substring(0, 300) + '...');

    return {
      success: true,
      contentType: 'code',
      content: code,
    };
  } catch (error) {
    console.error('[WorkflowExecutor] Exception:', error);
    return {
      success: false,
      contentType: 'code',
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute an image generation workflow
 * Chat message → Generate image → Return URL for Phone rendering
 */
async function executeImageWorkflow(userMessage: string): Promise<WorkflowResult> {
  try {
    console.log('[WorkflowExecutor] Starting image generation for:', userMessage);

    const response = await grokApi.generateImage(userMessage, {
      n: 1,
      responseFormat: 'url',
    });

    if (!response.data || response.data.length === 0) {
      return {
        success: false,
        contentType: 'image',
        content: '',
        error: 'No image generated',
      };
    }

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      return {
        success: false,
        contentType: 'image',
        content: '',
        error: 'No image URL in response',
      };
    }

    console.log('[WorkflowExecutor] Image generated successfully:', imageUrl);

    return {
      success: true,
      contentType: 'image',
      content: imageUrl,
    };
  } catch (error) {
    console.error('[WorkflowExecutor] Image generation error:', error);
    return {
      success: false,
      contentType: 'image',
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a web search workflow
 * Chat message → Web search → Generate formatted results UI for Phone
 */
async function executeWebSearchWorkflow(userMessage: string): Promise<WorkflowResult> {
  try {
    console.log('[WorkflowExecutor] Starting web search for:', userMessage);

    // Call the Grok web search API
    const searchResponse = await grokApi.webSearch(userMessage, {
      enableImageUnderstanding: false,
    });

    console.log('[WorkflowExecutor] Web search response:', searchResponse);

    // Extract the search results and citations
    const messageOutput = searchResponse.output.find(item => item.type === 'message');
    const textContent = messageOutput?.content?.find(c => c.type === 'output_text');
    const searchResultText = textContent?.text || 'No results found.';

    // Extract citations for sources
    const citations = searchResponse.inline_citations || [];
    const sources = citations
      .filter(c => c.web_citation)
      .map(c => ({
        title: c.web_citation?.title || 'Source',
        url: c.web_citation?.url || '',
      }))
      .slice(0, 5); // Limit to 5 sources

    console.log('[WorkflowExecutor] Extracted sources:', sources);

    // Return the search results as structured data for the Phone to render
    return {
      success: true,
      contentType: 'webSearch',
      content: JSON.stringify({
        query: userMessage,
        answer: searchResultText,
        sources,
      }),
    };
  } catch (error) {
    console.error('[WorkflowExecutor] Web search error:', error);
    return {
      success: false,
      contentType: 'webSearch',
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a deep research/reasoning workflow
 * Chat message → Reasoning API with high effort → Return structured analysis for Phone
 */
async function executeReasoningWorkflow(userMessage: string): Promise<WorkflowResult> {
  try {
    console.log('[WorkflowExecutor] Starting deep research for:', userMessage);

    // Call the Grok reasoning API with high effort
    const response = await grokApi.reasoning(userMessage, {
      reasoningEffort: 'high',
      systemPrompt: `You are a deep research analyst. Provide thorough, well-reasoned analysis with:
1. Clear structure with sections
2. Key insights and findings
3. Supporting evidence and reasoning
4. Conclusions and recommendations

Format your response with markdown headers (##, ###) for sections, bullet points for lists, and **bold** for emphasis.`,
    });

    console.log('[WorkflowExecutor] Reasoning response received');

    if (!response.choices || response.choices.length === 0) {
      return {
        success: false,
        contentType: 'reasoning',
        content: '',
        error: 'No response from reasoning model',
      };
    }

    const answer = response.choices[0].message.content;
    const reasoningTokens = response.usage?.reasoning_tokens || 0;

    // Return structured data for the Phone to render
    return {
      success: true,
      contentType: 'reasoning',
      content: JSON.stringify({
        query: userMessage,
        answer,
        reasoningTokens,
        model: response.model,
      }),
    };
  } catch (error) {
    console.error('[WorkflowExecutor] Reasoning error:', error);
    return {
      success: false,
      contentType: 'reasoning',
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute an X/Twitter fetch workflow
 * Chat message → Search X/Twitter API → Return tweets for Phone rendering
 */
async function executeXFetchWorkflow(userMessage: string): Promise<WorkflowResult> {
  try {
    console.log('[WorkflowExecutor] Starting X search for:', userMessage);

    // Call the Twitter search API
    const searchResult = await searchTweets(userMessage, {
      maxResults: 15,
    });

    console.log('[WorkflowExecutor] X search response:', searchResult);

    if (!searchResult.success) {
      return {
        success: false,
        contentType: 'xFetch',
        content: '',
        error: searchResult.error || 'Failed to search X',
      };
    }

    // Map tweets to a simplified format
    const tweets = searchResult.tweets.map((tweet: Tweet) => ({
      id: tweet.id,
      text: tweet.text,
      author: tweet.author,
      username: tweet.authorUsername,
      createdAt: tweet.createdAt,
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
    }));

    // Return structured data for the Phone to render
    return {
      success: true,
      contentType: 'xFetch',
      content: JSON.stringify({
        query: userMessage,
        count: searchResult.count,
        tweets,
        searchedAt: searchResult.metadata.searchedAt,
      }),
    };
  } catch (error) {
    console.error('[WorkflowExecutor] X search error:', error);
    return {
      success: false,
      contentType: 'xFetch',
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute an X/Twitter DM simulation workflow
 * Chat message → Simulate DM conversation → Return DM UI for Phone rendering
 */
async function executeXDMWorkflow(
  userMessage: string,
  recipientName: string = 'User',
  recipientUsername: string = 'user'
): Promise<WorkflowResult> {
  try {
    console.log('[WorkflowExecutor] Starting X DM simulation for:', userMessage);
    console.log('[WorkflowExecutor] Recipient:', recipientName, '@' + recipientUsername);

    // Create simulated DM conversation
    const now = new Date();
    const messages = [
      {
        id: 'dm-' + Date.now(),
        text: userMessage,
        isOutgoing: true,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered' as const,
      },
    ];

    // Return structured data for the Phone to render
    return {
      success: true,
      contentType: 'xDM',
      content: JSON.stringify({
        recipientName,
        recipientUsername,
        messages,
        sentAt: now.toISOString(),
      }),
    };
  } catch (error) {
    console.error('[WorkflowExecutor] X DM simulation error:', error);
    return {
      success: false,
      contentType: 'xDM',
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main workflow executor
 * Determines the workflow type and executes the appropriate pipeline
 */
export async function executeWorkflow(
  userMessage: string,
  processingType: NodeType | null,
  processingNode?: GrokBlock | null
): Promise<WorkflowResult> {
  console.log('[executeWorkflow] Executing workflow with processingType:', processingType);
  console.log('[executeWorkflow] User message:', userMessage);
  console.log('[executeWorkflow] Processing node:', processingNode);

  switch (processingType) {
    case 'codeExecution':
      console.log('[executeWorkflow] Routing to CODE workflow');
      return executeCodeWorkflow(userMessage);

    case 'vision':
      // Vision node in workflow context = image generation
      console.log('[executeWorkflow] Routing to IMAGE workflow');
      return executeImageWorkflow(userMessage);

    case 'imageInput':
      // imageInput node can also be used for image generation
      console.log('[executeWorkflow] Routing to IMAGE workflow (via imageInput)');
      return executeImageWorkflow(userMessage);

    case 'webSearch':
      // Web search workflow
      console.log('[executeWorkflow] Routing to WEB SEARCH workflow');
      return executeWebSearchWorkflow(userMessage);

    case 'reasoning':
      // Deep research/reasoning workflow
      console.log('[executeWorkflow] Routing to REASONING workflow');
      return executeReasoningWorkflow(userMessage);

    case 'xFetch':
      // X/Twitter search workflow
      console.log('[executeWorkflow] Routing to X FETCH workflow');
      return executeXFetchWorkflow(userMessage);

    case 'xDM':
      // X/Twitter DM simulation workflow
      console.log('[executeWorkflow] Routing to X DM workflow');
      // Extract recipient info from the XDM processing node
      const xdmNode = processingNode as { recipientName?: string; recipientUsername?: string } | null;
      return executeXDMWorkflow(
        userMessage,
        xdmNode?.recipientName || 'User',
        xdmNode?.recipientUsername || 'user'
      );

    default:
      console.log('[executeWorkflow] Unknown processingType, returning default');
      // No processing node or unknown type - just return as plain text
      return {
        success: true,
        contentType: 'default',
        content: userMessage,
      };
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  findWorkflowPath,
  getWorkflowType,
  executeWorkflow,
};
