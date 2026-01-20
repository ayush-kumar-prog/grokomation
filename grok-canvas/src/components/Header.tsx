import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useCanvasStore } from '../stores/canvasStore';

const Header: React.FC = () => {
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const blocks = useCanvasStore((s) => s.blocks);
  const connections = useCanvasStore((s) => s.connections);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center justify-between z-50 relative"
      style={{
        height: '56px',
        background: '#ffffff',
        borderBottom: '3px solid #000000',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-4" style={{ marginLeft: '8px' }}>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 900,
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          GROK FLOW
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6" style={{ marginRight: '8px' }}>
        <div className="flex items-center gap-6">
          <StatItem label="BLOCKS" value={blocks.length} />
          <StatItem label="CONNECTIONS" value={connections.length} />
        </div>

        {/* Divider */}
        <div style={{ width: '2px', height: '24px', background: '#000000' }} />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 transition-colors"
            style={{
              padding: '8px 16px',
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#000000';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#000000';
            }}
          >
            <Trash2 size={14} />
            <span>CLEAR</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
};

interface StatItemProps {
  label: string;
  value: number;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <span
      style={{
        fontSize: '12px',
        color: '#666666',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {label}
    </span>
    <div
      style={{
        minWidth: '28px',
        textAlign: 'center',
        padding: '4px 8px',
        background: '#000000',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      {value}
    </div>
  </div>
);

export default Header;
