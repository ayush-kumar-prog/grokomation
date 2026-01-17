import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-14 bg-[#1a1f25]/80 backdrop-blur-xl border-b border-[#2a3441] flex items-center justify-between z-50 relative"
      style={{ paddingLeft: '24px', paddingRight: '24px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-4" style={{ marginLeft: '8px' }}>
        <span className="text-lg font-semibold text-white tracking-tight">Grok Flow</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6" style={{ marginRight: '8px' }}>
        <div className="flex items-center gap-6">
          <StatItem label="Blocks" value={blocks.length} color="primary" />
          <StatItem label="Connections" value={connections.length} color="success" />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#2a3441]" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={16} />
            <span>Clear</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

interface StatItemProps {
  label: string;
  value: number;
  color: 'primary' | 'success';
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <div className={cn(
      'min-w-[28px] text-center px-2 py-0.5 rounded-md text-sm font-semibold',
      color === 'primary'
        ? 'bg-blue-500/15 text-blue-400'
        : 'bg-emerald-500/15 text-emerald-400'
    )}>
      {value}
    </div>
  </div>
);

export default Header;
