import type { Tweet, XNodeOutput } from '../types/canvas';

const TWITTER_BEARER_TOKEN = import.meta.env.VITE_TWITTER_BEARER_TOKEN;

/**
 * Search X/Twitter for tweets using the REAL X API
 * Uses Vite proxy to bypass CORS restrictions
 */
export async function searchTweets(
  query: string,
  options: {
    maxResults?: number;
  } = {}
): Promise<XNodeOutput> {
  const { maxResults = 20 } = options;
  const startTime = Date.now();

  if (!TWITTER_BEARER_TOKEN) {
    return {
      success: false,
      query,
      count: 0,
      tweets: [],
      metadata: {
        searchedAt: new Date().toISOString(),
        apiResponseTime: 0,
      },
      error: 'X API Bearer Token not configured',
    };
  }

  try {
    // Build search params
    const params = new URLSearchParams({
      query: query,
      max_results: String(Math.min(Math.max(maxResults, 10), 100)), // X API requires 10-100
      'tweet.fields': 'created_at,public_metrics,author_id,text',
      'expansions': 'author_id',
      'user.fields': 'username,name,profile_image_url',
    });

    // Use the Vite proxy to bypass CORS
    // /api/twitter/* gets rewritten to https://api.twitter.com/*
    const response = await fetch(`/api/twitter/2/tweets/search/recent?${params}`, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('X API error:', response.status, errorData);

      // Handle specific error cases
      if (response.status === 401) {
        return {
          success: false,
          query,
          count: 0,
          tweets: [],
          metadata: {
            searchedAt: new Date().toISOString(),
            apiResponseTime: Date.now() - startTime,
          },
          error: 'X API authentication failed. Check your Bearer Token.',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          query,
          count: 0,
          tweets: [],
          metadata: {
            searchedAt: new Date().toISOString(),
            apiResponseTime: Date.now() - startTime,
          },
          error: 'X API rate limit exceeded. Try again later.',
        };
      }

      return {
        success: false,
        query,
        count: 0,
        tweets: [],
        metadata: {
          searchedAt: new Date().toISOString(),
          apiResponseTime: Date.now() - startTime,
        },
        error: `X API error: ${response.status} - ${errorData?.detail || errorData?.title || 'Unknown error'}`,
      };
    }

    const data = await response.json();

    // Check if we got any tweets
    if (!data.data || data.data.length === 0) {
      return {
        success: true,
        query,
        count: 0,
        tweets: [],
        metadata: {
          searchedAt: new Date().toISOString(),
          apiResponseTime: Date.now() - startTime,
        },
      };
    }

    // Map users by ID for easy lookup
    const users = new Map<string, { id: string; name: string; username: string; profile_image_url?: string }>(
      (data.includes?.users || []).map((u: any) => [u.id, u])
    );

    // Map X API response to our Tweet type
    const tweets: Tweet[] = data.data.map((tweet: any) => {
      const author = users.get(tweet.author_id);
      return {
        id: tweet.id,
        text: tweet.text,
        author: author?.name || 'Unknown',
        authorUsername: author?.username || 'unknown',
        createdAt: tweet.created_at || new Date().toISOString(),
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
      };
    });

    return {
      success: true,
      query,
      count: tweets.length,
      tweets,
      metadata: {
        searchedAt: new Date().toISOString(),
        apiResponseTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error('Tweet search error:', error);
    return {
      success: false,
      query,
      count: 0,
      tweets: [],
      metadata: {
        searchedAt: new Date().toISOString(),
        apiResponseTime: Date.now() - startTime,
      },
      error: error instanceof Error ? error.message : 'Network error - check your connection',
    };
  }
}
