import { validateXQuery } from '../api/grok';
import { searchTweets } from '../api/twitter';
import type { XSearchBlock, XNodeOutput, XQueryValidationResult } from '../types/canvas';

export interface ExecuteXNodeResult {
  success: boolean;
  validationResult?: XQueryValidationResult;
  output?: XNodeOutput;
  error?: string;
}

/**
 * Executes the X Search Node
 * 1. Validates the query using Grok
 * 2. If valid, searches X for matching tweets
 * 3. Returns the results as JSON
 */
export async function executeXNode(
  nodeData: XSearchBlock,
  inputFromConnection?: string
): Promise<ExecuteXNodeResult> {
  // Get the query - either from the node's stored query or from connected input
  const query = inputFromConnection || nodeData.query;

  if (!query || query.trim() === '') {
    return {
      success: false,
      error: 'No query provided. Please enter a search query.',
    };
  }

  // Step 1: Validate the query using Grok
  const validationResult = await validateXQuery(query);

  if (!validationResult.valid) {
    return {
      success: false,
      validationResult,
      error: validationResult.reason || 'Query validation failed',
    };
  }

  // Step 2: Search X using the parsed query
  const searchQuery = validationResult.parsed?.searchQuery || query;

  try {
    const output = await searchTweets(searchQuery, {
      maxResults: 50,
    });

    // Add threshold and time window to output if parsed
    if (validationResult.parsed) {
      output.threshold = validationResult.parsed.threshold;
      output.timeWindow = validationResult.parsed.timeWindow;
    }

    return {
      success: output.success,
      validationResult,
      output,
      error: output.error,
    };
  } catch (error) {
    return {
      success: false,
      validationResult,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

/**
 * Gets the output from a node's execution state
 * Used by downstream nodes to get input data
 */
export function getNodeOutput(nodeOutputs: Record<string, unknown>, nodeId: string): unknown {
  return nodeOutputs[nodeId];
}

/**
 * Checks if a node can be executed based on its connections
 * A node can execute if all its input connections have completed
 */
export function canExecuteNode(
  nodeId: string,
  connections: { source: string; target: string }[],
  executedNodes: Set<string>
): boolean {
  // Find all connections where this node is the target (incoming)
  const incomingConnections = connections.filter((c) => c.target === nodeId);

  // If no incoming connections, node can execute immediately
  if (incomingConnections.length === 0) {
    return true;
  }

  // Otherwise, all source nodes must have executed
  return incomingConnections.every((c) => executedNodes.has(c.source));
}
