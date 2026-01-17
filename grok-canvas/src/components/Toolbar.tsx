import React from 'react';
import {
  MousePointer,
  Type,
  Image,
  MessageSquare,
  Eye,
  Brain,
  Globe,
  Code,
  ArrowRightFromLine,
} from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';
import type { ToolType } from '../types/canvas';

// X Logo SVG Component
const XLogo: React.FC<{ size?: number; strokeWidth?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface ToolItem {
  id: ToolType;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  color: string;
}

const tools: ToolItem[] = [
  { id: 'select', icon: MousePointer, label: 'Select', color: '#3b82f6' },
  { id: 'textInput', icon: Type, label: 'Text Input', color: '#6366f1' },
  { id: 'imageInput', icon: Image, label: 'Image Input', color: '#8b5cf6' },
  { id: 'textCompletion', icon: MessageSquare, label: 'Text Completion', color: '#10b981' },
  { id: 'vision', icon: Eye, label: 'Vision', color: '#f59e0b' },
  { id: 'reasoning', icon: Brain, label: 'Reasoning', color: '#ec4899' },
  { id: 'webSearch', icon: Globe, label: 'Web Search', color: '#3b82f6' },
  { id: 'xSearch', icon: XLogo, label: 'X', color: '#ffffff' },
  { id: 'codeExecution', icon: Code, label: 'Code Execution', color: '#ef4444' },
  { id: 'output', icon: ArrowRightFromLine, label: 'Output', color: '#64748b' },
];

const Toolbar: React.FC = () => {
  const selectedTool = useCanvasStore((s) => s.selectedTool);
  const setSelectedTool = useCanvasStore((s) => s.setSelectedTool);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-3 bg-[#141a1f] rounded-[20px] px-4 py-3 border border-gray-700/30 shadow-2xl shadow-black/60">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;
          const isXTool = tool.id === 'xSearch';

          return (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`
                relative p-4 rounded-2xl transition-all duration-200 group
                ${isSelected
                  ? isXTool ? 'text-black' : 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
                }
              `}
              style={{
                backgroundColor: isSelected ? tool.color : undefined,
              }}
            >
              <Icon size={26} strokeWidth={isSelected ? 2 : 1.5} />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-[#1a2128] text-white text-sm font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-xl border border-gray-700/30">
                {tool.label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#1a2128]" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Placement hint */}
      {selectedTool !== 'select' && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#1a2128] text-white text-sm px-5 py-3 rounded-xl whitespace-nowrap border border-gray-700/30 shadow-xl animate-fade-in">
          Click anywhere to place <span className="font-semibold text-blue-400">{tools.find(t => t.id === selectedTool)?.label}</span>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
