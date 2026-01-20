import React, { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import Header from './Header';

// Interface for incoming Grok query
interface GrokQuery {
  query: string;
  source: string;
  timestamp: number;
}

const CanvasContainer: React.FC = () => {
  const [incomingQuery, setIncomingQuery] = useState<GrokQuery | null>(null);

  useEffect(() => {
    // Listen for messages from the Chrome extension via BroadcastChannel
    const channel = new BroadcastChannel('grok-canvas-channel');

    channel.onmessage = (event) => {
      console.log('[Canvas] Received message from extension:', event.data);
      if (event.data.type === 'GROK_QUERY') {
        setIncomingQuery({
          query: event.data.query,
          source: event.data.source,
          timestamp: event.data.timestamp,
        });
      }
    };

    // Also check URL params on load
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('query');
    const sourceParam = urlParams.get('source');

    if (queryParam) {
      console.log('[Canvas] Query from URL:', queryParam);
      setIncomingQuery({
        query: queryParam,
        source: sourceParam || 'url',
        timestamp: Date.now(),
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => {
      channel.close();
    };
  }, []);

  // Show notification when query arrives
  useEffect(() => {
    if (incomingQuery) {
      console.log('[Canvas] New query to process:', incomingQuery.query);
      // Clear after handling
      const timer = setTimeout(() => setIncomingQuery(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [incomingQuery]);

  return (
    <div
      className="w-full h-screen overflow-hidden flex flex-col"
      style={{ background: '#f5f5f5' }}
    >
      <Header />
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <Canvas />
          <Toolbar />
        </ReactFlowProvider>

        {/* Incoming query notification */}
        {incomingQuery && (
          <div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top"
            style={{
              background: '#000000',
              color: '#ffffff',
              padding: '16px 24px',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0 #000000',
              maxWidth: '500px',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  background: '#00ff00',
                  animation: 'pulse 1s infinite',
                }}
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-1">
                  Query from {incomingQuery.source}
                </p>
                <p className="text-sm">
                  "{incomingQuery.query.slice(0, 100)}{incomingQuery.query.length > 100 ? '...' : ''}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasContainer;
