import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Tooltip } from './ui/tooltip';
import { cn } from '@/lib/utils';
import type { ToolType } from '../types/canvas';

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
  { id: 'xSearch', icon: XLogo, label: 'X Search', color: '#ffffff' },
  { id: 'codeExecution', icon: Code, label: 'Code Execution', color: '#ef4444' },
  { id: 'output', icon: ArrowRightFromLine, label: 'Output', color: '#64748b' },
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
      {/* Main toolbar */}
      <div className="flex items-center gap-3 bg-[#1a1f25] rounded-[24px] p-5 border border-[#2a3441] shadow-2xl shadow-black/40">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;
          const isXTool = tool.id === 'xSearch';

          return (
            <Tooltip key={tool.id} content={tool.label} side="top">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                onClick={() => setSelectedTool(tool.id)}
                className={cn(
                  'relative p-4 rounded-xl transition-all duration-200',
                  isSelected
                    ? 'text-white'
                    : 'text-gray-500 hover:text-white hover:bg-[#252d38]'
                )}
              >
                {/* Selected background */}
                {isSelected && (
                  <motion.div
                    layoutId="toolbar-selection"
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: tool.color }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  size={28}
                  strokeWidth={isSelected ? 2.5 : 1.75}
                  className={cn(
                    'relative z-10 transition-transform duration-200',
                    isSelected && 'scale-110',
                    isSelected && isXTool && 'text-black'
                  )}
                />
              </motion.button>
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
            className="absolute -top-16 left-1/2 -translate-x-1/2"
          >
            <div className="bg-[#1a1f25] border border-[#2a3441] text-white text-sm px-4 py-2.5 rounded-xl whitespace-nowrap shadow-lg flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: tools.find((t) => t.id === selectedTool)?.color }}
              />
              Click to place{' '}
              <span
                className="font-semibold"
                style={{ color: tools.find((t) => t.id === selectedTool)?.color }}
              >
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
