import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer,
  MessageSquare,
  Brain,
  Globe,
  Image,
  Code,
  Smartphone,
} from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';
import { Tooltip } from './ui/tooltip';
import { cn } from '@/lib/utils';
import type { ToolType } from '../types/canvas';

const XLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface ToolItem {
  id: ToolType;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

const tools: ToolItem[] = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'textCompletion', icon: MessageSquare, label: 'Grok Chat' },
  { id: 'reasoning', icon: Brain, label: 'Reasoning' },
  { id: 'webSearch', icon: Globe, label: 'Web Search' },
  { id: 'xFetch', icon: XLogo, label: 'X Fetch' },
  { id: 'imageInput', icon: Image, label: 'Image' },
  { id: 'codeExecution', icon: Code, label: 'Code' },
  { id: 'phone', icon: Smartphone, label: 'Phone' },
];

const Toolbar: React.FC = () => {
  const selectedTool = useCanvasStore((s) => s.selectedTool);
  const setSelectedTool = useCanvasStore((s) => s.setSelectedTool);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
    >
      {/* Main toolbar - glassmorphism style */}
      <div className="flex items-center gap-2.5 bg-[#1a1a1a]/80 backdrop-blur-md rounded-xl p-2.5 border border-[#2a2a2a] shadow-2xl"
        style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}
      >
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <Tooltip key={tool.id} content={tool.label} side="top">
              <button
                onClick={() => setSelectedTool(tool.id)}
                className={cn(
                  'p-3 rounded-lg transition-all duration-300 flex items-center justify-center w-11 h-11 group',
                  isSelected
                    ? 'bg-[#3b82f6] text-white shadow-xl scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50 hover:scale-105'
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    'transition-all duration-300',
                    isSelected ? 'drop-shadow-lg' : 'group-hover:scale-110'
                  )}
                />
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Placement hint */}
      <AnimatePresence>
        {selectedTool !== 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2"
          >
            <div className="bg-[#1a1a1a]/90 backdrop-blur-md border text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-lg flex items-center gap-2"
              style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse bg-[#3b82f6]" />
              Click to place{' '}
              <span className="font-medium text-[#3b82f6]">
                {tools.find((t) => t.id === selectedTool)?.label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Toolbar;
