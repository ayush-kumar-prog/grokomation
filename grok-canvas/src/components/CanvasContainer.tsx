import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import Header from './Header';

const CanvasContainer: React.FC = () => {
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
      </div>
    </div>
  );
};

export default CanvasContainer;
