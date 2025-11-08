import React, { useState, useCallback } from 'react';
import { Brain, Lightbulb, AlertTriangle, TrendingUp, MessageCircle } from 'lucide-react';

const AIPanel = ({ commune, ressources, isMobile }) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const analyzeCommune = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze-commune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ressources: ressources,
          commune: commune
        })
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.data);
      }
    } catch (error) {
      console.error('Erreur analyse IA:', error);
    } finally {
      setLoading(false);
    }
  }, [commune, ressources]);

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    const newMessage = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, newMessage]);
    setChatMessage('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: chatMessage,
          context: { commune: commune.nom, ressourcesCount: ressources.length }
        })
      });

      const data = await response.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: data.response.response,
          suggestions: data.response.suggestions 
        }]);
      }
    } catch (error) {
      console.error('Erreur chatbot:', error);
    }
  };

  const tabs = [
    { id: 'analysis', label: 'Analyse IA', icon: Brain },
    { id: 'predictions', label: 'Prévisions', icon: TrendingUp },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
    { id: 'chat', label: 'Assistant', icon: MessageCircle }
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #f0f0f0',
        marginBottom: '20px',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                background: activeTab === tab.id ? '#00853f' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px 8px 0 0',
                fontSize: '14px',
                fontWeight: '500',
                flex: isMobile ? '1 0 50%' : 'none'
              }}
            >
              <Icon size={16} />
              {!isMobile && tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenu des onglets */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'analysis' && (
          <AnalysisTab 
            analysis={analysis} 
            loading={loading} 
            onAnalyze={analyzeCommune}
            isMobile={isMobile}
          />
        )}

        {activeTab === 'predictions' && (
          <PredictionsTab 
            commune={commune}
            isMobile={isMobile}
          />
        )}

        {activeTab === 'anomalies' && (
          <AnomaliesTab 
            commune={commune}
            isMobile={isMobile}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            chatHistory={chatHistory}
            chatMessage={chatMessage}
            onMessageChange={setChatMessage}
            onSendMessage={sendChatMessage}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
};

// Composant pour l'onglet Analyse
const AnalysisTab = ({ analysis, loading, onAnalyze, isMobile }) => (
  <div>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#00853f', margin: 0 }}>Analyse Intelligente</h3>
      <button
        onClick={onAnalyze}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#00853f',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Brain size={16} />
        {loading ? 'Analyse en cours...' : 'Lancer l\'analyse'}
      </button>
    </div>

    {analysis ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <AnalysisSection title="Patterns détectés" items={analysis.patterns} />
        <AnalysisSection title="Recommandations" items={analysis.recommendations} />
        <AnalysisSection title="Prévisions" items={Object.values(analysis.predictions)} />
        <AnalysisSection title="Zones de vigilance" items={analysis.risk_areas} type="warning" />
      </div>
    ) : (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <Lightbulb size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>Cliquez sur "Lancer l'analyse" pour obtenir des insights intelligents sur votre commune</p>
      </div>
    )}
  </div>
);

const AnalysisSection = ({ title, items, type = 'info' }) => (
  <div>
    <h4 style={{ 
      color: type === 'warning' ? '#dc2626' : '#00853f',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      {type === 'warning' ? <AlertTriangle size={16} /> : <Lightbulb size={16} />}
      {title}
    </h4>
    <ul style={{ margin: 0, paddingLeft: '20px' }}>
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: '8px', lineHeight: '1.5' }}>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

// Composant pour l'onglet Prévisions
const PredictionsTab = ({ commune, isMobile }) => (
  <div>
    <h3 style={{ color: '#00853f', marginBottom: '20px' }}>Prévisions de Développement</h3>
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '16px'
    }}>
      <PredictionCard 
        title="Court terme (1-2 ans)"
        predictions={[
          "Croissance modérée du secteur touristique",
          "Amélioration des infrastructures de base",
          "Diversification des activités économiques"
        ]}
        confidence={0.75}
      />
      <PredictionCard 
        title="Moyen terme (3-5 ans)"
        predictions={[
          "Développement significatif de l'écotourisme",
          "Modernisation des systèmes agricoles",
          "Renforcement des capacités locales"
        ]}
        confidence={0.65}
      />
    </div>
  </div>
);

const PredictionCard = ({ title, predictions, confidence }) => (
  <div style={{
    background: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  }}>
    <h4 style={{ color: '#00853f', margin: '0 0 12px 0' }}>{title}</h4>
    <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
      {predictions.map((pred, index) => (
        <li key={index} style={{ marginBottom: '6px', fontSize: '14px' }}>
          {pred}
        </li>
      ))}
    </ul>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: '#666'
    }}>
      <div style={{
        width: '60px',
        height: '4px',
        background: '#e9ecef',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${confidence * 100}%`,
          height: '100%',
          background: '#00853f'
        }} />
      </div>
      Confiance: {Math.round(confidence * 100)}%
    </div>
  </div>
);

// Composant pour l'onglet Chat
const ChatTab = ({ chatHistory, chatMessage, onMessageChange, onSendMessage, isMobile }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
    <h3 style={{ color: '#00853f', marginBottom: '16px' }}>Assistant IA</h3>
    
    <div style={{
      flex: 1,
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      overflowY: 'auto',
      background: '#f8f9fa'
    }}>
      {chatHistory.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
          <MessageCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>Posez-moi des questions sur le développement de votre commune !</p>
        </div>
      ) : (
        chatHistory.map((msg, index) => (
          <div key={index} style={{
            marginBottom: '12px',
            padding: '12px',
            background: msg.role === 'user' ? '#00853f' : 'white',
            color: msg.role === 'user' ? 'white' : 'inherit',
            borderRadius: '8px',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            marginLeft: msg.role === 'user' ? 'auto' : '0'
          }}>
            {msg.content}
            {msg.suggestions && (
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <strong>Suggestions:</strong> {msg.suggestions.join(', ')}
              </div>
            )}
          </div>
        ))
      )}
    </div>

    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="text"
        value={chatMessage}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="Posez votre question..."
        style={{
          flex: 1,
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px'
        }}
        onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
      />
      <button
        onClick={onSendMessage}
        style={{
          padding: '12px 20px',
          background: '#00853f',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Envoyer
      </button>
    </div>
  </div>
);

// Composant pour l'onglet Anomalies
const AnomaliesTab = ({ commune, isMobile }) => (
  <div>
    <h3 style={{ color: '#00853f', marginBottom: '20px' }}>Détection d'Anomalies</h3>
    <div style={{
      background: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <AlertTriangle size={16} color="#856404" />
        <strong style={{ color: '#856404' }}>Fonctionnalité en développement</strong>
      </div>
      <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
        La détection automatique d'anomalies sera bientôt disponible. 
        Elle identifiera les patterns inhabituels dans vos données communales.
      </p>
    </div>
  </div>
);

export default AIPanel;