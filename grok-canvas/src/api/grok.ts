import type { XQueryValidationResult } from '../types/canvas';

const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1';

/**
 * Validates a user's X/Twitter search query using Grok
 * Determines if the request is feasible and extracts search parameters
 */
export async function validateXQuery(userInput: string): Promise<XQueryValidationResult> {
  if (!XAI_API_KEY) {
    return {
      valid: false,
      reason: 'Grok API key not configured',
    };
  }

  const validationPrompt = `You are validating a user's X/Twitter search request. Analyze the input and determine:
1. Is this request feasible to execute via X API?
2. What search query should be used?
3. Are there any thresholds or time windows mentioned?

Rules:
- Thresholds below 10 are too low - reject with reason "Threshold too low, try a higher number"
- Requests for "all users" or "everything" or "every tweet" are too broad - reject with reason "Request too broad, please be more specific"
- Vague requests with no clear search term (hashtag, username, or keyword) - reject with reason "Could not identify a clear search term"
- Valid hashtags (#topic), usernames (@user), or keywords - accept
- If no threshold mentioned, that's fine - just extract the search query

User input: "${userInput}"

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "valid": boolean,
  "reason": "string explaining why invalid, or null if valid",
  "parsed": {
    "searchQuery": "the actual search term to use with X API",
    "threshold": number or null,
    "timeWindow": "1h" or "24h" or null
  }
}`;

  try {
    const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'user',
            content: validationPrompt,
          },
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API error:', errorText);
      return {
        valid: false,
        reason: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        valid: false,
        reason: 'No response from Grok',
      };
    }

    // Parse the JSON response
    try {
      // Clean the response - remove any markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedContent);
      return {
        valid: parsed.valid,
        reason: parsed.reason || undefined,
        parsed: parsed.valid ? parsed.parsed : undefined,
      };
    } catch (parseError) {
      console.error('Failed to parse Grok response:', content);
      return {
        valid: false,
        reason: 'Failed to parse validation response',
      };
    }
  } catch (error) {
    console.error('Grok validation error:', error);
    return {
      valid: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Simple text completion using Grok
 * Used for general purpose text generation
 */
export async function grokComplete(prompt: string, systemPrompt?: string): Promise<string> {
  if (!XAI_API_KEY) {
    throw new Error('Grok API key not configured');
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
