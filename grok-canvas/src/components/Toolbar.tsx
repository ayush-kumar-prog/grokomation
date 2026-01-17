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
  { id: 'select', icon: MousePointer, label: 'SELECT' },
  { id: 'textCompletion', icon: MessageSquare, label: 'GROK CHAT' },
  { id: 'reasoning', icon: Brain, label: 'REASONING' },
  { id: 'webSearch', icon: Globe, label: 'WEB SEARCH' },
  { id: 'xFetch', icon: XLogo, label: 'X FETCH' },
  { id: 'imageInput', icon: Image, label: 'IMAGE' },
  { id: 'codeExecution', icon: Code, label: 'CODE' },
  { id: 'phone', icon: Smartphone, label: 'PHONE' },
];

const Toolbar: React.FC = () => {
  const selectedTool = useCanvasStore((s) => s.selectedTool);
  const setSelectedTool = useCanvasStore((s) => s.setSelectedTool);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
    >
      {/* Main toolbar - Brutalist style */}
      <div
        className="flex items-center gap-0"
        style={{
          background: '#ffffff',
          border: '3px solid #000000',
        }}
      >
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <React.Fragment key={tool.id}>
              {index > 0 && (
                <div style={{ width: '2px', height: '44px', background: '#000000' }} />
              )}
              <Tooltip content={tool.label} side="top">
                <button
                  onClick={() => setSelectedTool(tool.id)}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    width: '48px',
                    height: '48px',
                    background: isSelected ? '#000000' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#000000',
                  }}
                >
                  <Icon size={20} />
                </button>
              </Tooltip>
            </React.Fragment>
          );
        })}
      </div>

      {/* Placement hint - Brutalist */}
      <AnimatePresence>
        {selectedTool !== 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2"
          >
            <div
              className="whitespace-nowrap flex items-center gap-2"
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #000000',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  background: '#ffffff',
                }}
              />
              CLICK TO PLACE {tools.find((t) => t.id === selectedTool)?.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Toolbar;
