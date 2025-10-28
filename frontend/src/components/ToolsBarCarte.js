import React, { useState } from 'react';

const ToolsBarCarte = ({ 
  onMeasureDistance, 
  onDrawPolygon, 
  onPrintMap,
  isMobile = false 
}) => {
  const [activeTool, setActiveTool] = useState(null);

  const tools = [
    {
      id: 'measure',
      icon: '📏',
      label: 'Mesurer',
      title: 'Mesurer une distance',
      action: onMeasureDistance
    },
    {
      id: 'draw',
      icon: '🖊️',
      label: 'Dessiner',
      title: 'Dessiner une zone',
      action: onDrawPolygon
    },
    {
      id: 'print',
      icon: '🖨️',
      label: 'Imprimer',
      title: 'Imprimer la carte',
      action: onPrintMap
    },
    {
      id: 'layers',
      icon: '🗂️',
      label: 'Couches',
      title: 'Gérer les couches',
      action: () => console.log('Gérer les couches')
    }
  ];

  const handleToolClick = (tool) => {
    setActiveTool(activeTool === tool.id ? null : tool.id);
    if (tool.action) {
      tool.action();
    }
  };

  return (
    <div 
      className="tools-bar-carte"
      style={{
        position: 'absolute',
        top: isMobile ? '130px' : '20px',
        right: '20px',
        zIndex: 1000,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--elevation-3)',
        padding: '8px',
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        gap: '8px'
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool)}
          title={tool.title}
          className={`flutter-btn ${activeTool === tool.id ? 'primary' : 'secondary'}`}
          style={{
            padding: isMobile ? '10px 12px' : '12px',
            fontSize: isMobile ? '12px' : '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexDirection: isMobile ? 'column' : 'row',
            minWidth: isMobile ? '60px' : 'auto',
            height: isMobile ? 'auto' : 'auto'
          }}
        >
          <span style={{ fontSize: isMobile ? '16px' : '18px' }}>
            {tool.icon}
          </span>
          {!isMobile && <span>{tool.label}</span>}
        </button>
      ))}
    </div>
  );
};

export default ToolsBarCarte;