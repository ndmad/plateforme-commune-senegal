import React from 'react';
import { Star, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

const AIRecommendations = ({ recommendations, isMobile }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'high_impact': return <Star size={16} color="#f59e0b" />;
      case 'growth': return <TrendingUp size={16} color="#10b981" />;
      case 'urgent': return <AlertTriangle size={16} color="#dc2626" />;
      default: return <Lightbulb size={16} color="#00853f" />;
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        color: '#00853f', 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Lightbulb size={20} />
        Recommandations Intelligentes
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recommendations.map((rec, index) => (
          <div
            key={index}
            style={{
              padding: '12px 16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            {getIcon(rec.type)}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {rec.title}
              </div>
              <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                {rec.description}
              </div>
              {rec.impact && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#00853f',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <TrendingUp size={12} />
                  Impact: {rec.impact}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendations;