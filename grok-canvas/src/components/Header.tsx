import React from 'react';
import { Sparkles, Trash2, Play } from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';

const Header: React.FC = () => {
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);

  return (
    <header className="h-16 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-6 z-50">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">Grok Flow</span>
        </div>
        <span className="text-[11px] text-gray-500 bg-gray-800/80 px-2.5 py-1 rounded-full font-medium tracking-wide uppercase">Beta</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-gray-500 font-medium">Blocks</span>
            <span className="text-white font-semibold bg-gray-800/60 px-2.5 py-0.5 rounded-md min-w-[28px] text-center">{blocks.length}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-gray-500 font-medium">Connections</span>
            <span className="text-white font-semibold bg-gray-800/60 px-2.5 py-0.5 rounded-md min-w-[28px] text-center">{connections.length}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-800" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 font-medium"
          >
            <Trash2 size={16} />
            <span>Clear</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 font-semibold">
            <Play size={16} fill="currentColor" />
            <span>Run Flow</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
