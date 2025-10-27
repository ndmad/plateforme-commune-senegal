import React, { useState } from 'react';
import { 
  exportToExcel, 
  exportDashboardExcel,
  exporterDonneesBrutes
} from './ExportFunctions';

const ExportDonnees = ({ 
  ressources = [], 
  stats = {}, 
  type = 'ressources',
  onExportStart,
  onExportComplete,
  isMobile = false
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  const handleExport = async (exportFunction, format, options = {}) => {
    if (exporting) return;
    
    setExporting(true);
    setExportProgress(`Préparation ${format}...`);
    
    if (onExportStart) onExportStart(format);
    
    try {
      console.log(`🚀 Début export ${format}`, { 
        nbRessources: ressources.length,
        type 
      });
      
      await exportFunction(ressources, stats, options);
      setExportProgress(`✅ ${format} réussi !`);
      
      if (onExportComplete) {
        onExportComplete(true, format);
      }
      
      setTimeout(() => {
        setExporting(false);
        setExportProgress('');
      }, 2000);
      
    } catch (error) {
      console.error(`❌ Erreur export ${format}:`, error);
      const errorMessage = error.message || 'Erreur inconnue';
      setExportProgress(`❌ ${errorMessage}`);
      
      if (onExportComplete) {
        onExportComplete(false, format, errorMessage);
      }
      
      setTimeout(() => {
        setExporting(false);
        setExportProgress('');
      }, 4000);
    }
  };

  const getExportOptions = () => {
    if (type === 'dashboard') {
      return [
        {
          label: '📊 Statistiques CSV',
          description: 'Export des indicateurs et analyses',
          onClick: () => handleExport(exportDashboardExcel, 'CSV Statistiques'),
          format: 'csv'
        },
        {
          label: '📋 Données Brutes CSV',
          description: 'Toutes les ressources en format tableur',
          onClick: () => handleExport(exportToExcel, 'CSV Données'),
          format: 'csv'
        }
      ];
    }

    return [
      {
        label: '📊 Excel/CSV Complet',
        description: 'Format tableur avec toutes les colonnes',
        onClick: () => handleExport(exportToExcel, 'CSV'),
        format: 'csv'
      },
      {
        label: '🔍 Données Structurées',
        description: 'Format JSON pour analyse avancée',
        onClick: () => {
          const data = exporterDonneesBrutes(ressources);
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `donnees-brutes-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        },
        format: 'json'
      }
    ];
  };

  const exportOptions = getExportOptions();

  if (isMobile) {
    return (
      <div className="export-container" style={{ 
        padding: '8px',
        overflow: 'visible',
        width: '100%'
      }}>
        <div className="flutter-card" style={{ 
          padding: '16px',
          overflow: 'visible',
          minHeight: 'auto',
          width: '100%'
        }}>
          <div className="export-content" style={{ overflow: 'visible', width: '100%' }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📤 Exporter
            </h4>
            
            {exportProgress && (
              <div style={{
                padding: '8px 12px',
                background: exportProgress.includes('✅') ? '#dcfce7' : '#fef2f2',
                color: exportProgress.includes('✅') ? '#166534' : '#dc2626',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                marginBottom: '12px',
                border: `1px solid ${exportProgress.includes('✅') ? '#bbf7d0' : '#fecaca'}`,
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {exportProgress}
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
              width: '100%',
              overflow: 'visible'
            }}>
              {exportOptions.map((option, index) => (
                <button
                  key={index}
                  className={`flutter-btn ${exporting ? 'secondary' : 'primary'}`}
                  onClick={option.onClick}
                  disabled={exporting}
                  style={{
                    fontSize: '12px',
                    padding: '10px 12px',
                    justifyContent: 'flex-start',
                    width: '100%',
                    margin: '0'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{option.label.split(' ')[0]}</span>
                  {option.label.split(' ').slice(1).join(' ')}
                </button>
              ))}
            </div>
            
            {exporting && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginTop: '12px',
                fontSize: '11px',
                color: 'var(--on-background)',
                width: '100%'
              }}>
                <div className="flutter-spinner" style={{ width: '16px', height: '16px' }}></div>
                Génération en cours...
              </div>
            )}

            <div style={{ marginTop: '12px', width: '100%' }}>
              <small style={{ color: 'var(--on-background)', fontSize: '10px' }}>
                💡 CSV compatible Excel, LibreOffice, Google Sheets
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="export-donnees-container" style={{ 
      width: '100%',
      overflow: 'visible'
    }}>
      <div className="flutter-card elevated" style={{ 
        padding: '24px',
        overflow: 'visible',
        minHeight: 'auto',
        height: 'auto',
        width: '100%'
      }}>
        <div className="export-content" style={{ overflow: 'visible', width: '100%' }}>
          <h3 style={{ 
            marginBottom: '16px', 
            fontSize: '18px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📤 Export des Données
          </h3>
          
          <p style={{ 
            color: 'var(--on-background)', 
            marginBottom: '20px',
            fontSize: '14px',
            width: '100%'
          }}>
            {type === 'dashboard' 
              ? 'Exportez les analyses et statistiques au format tableur' 
              : 'Exportez la liste des ressources pour vos rapports et analyses'
            }
          </p>
          
          {exportProgress && (
            <div style={{
              padding: '12px 16px',
              background: exportProgress.includes('✅') ? '#dcfce7' : '#fef2f2',
              color: exportProgress.includes('✅') ? '#166534' : '#dc2626',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              marginBottom: '16px',
              border: `1px solid ${exportProgress.includes('✅') ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {exportProgress.includes('✅') ? '✅' : '🔄'} {exportProgress}
            </div>
          )}
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
            width: '100%',
            overflow: 'visible'
          }}>
            {exportOptions.map((option, index) => (
              <div key={index} style={{ overflow: 'visible' }}>
                <button
                  className={`flutter-btn ${exporting ? 'secondary' : 'primary'}`}
                  onClick={option.onClick}
                  disabled={exporting}
                  style={{
                    fontSize: '14px',
                    padding: '16px 12px',
                    flexDirection: 'column',
                    height: 'auto',
                    minHeight: '80px',
                    width: '100%',
                    margin: '0',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                    {option.label.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>
                    {option.label.split(' ').slice(1).join(' ')}
                  </div>
                  <div style={{ 
                    fontSize: '10px', 
                    opacity: '0.8',
                    marginTop: '4px'
                  }}>
                    {option.description}
                  </div>
                </button>
              </div>
            ))}
          </div>
          
          {exporting && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '12px',
              padding: '12px',
              background: 'var(--background)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              color: 'var(--on-background)',
              width: '100%'
            }}>
              <div className="flutter-spinner" style={{ width: '20px', height: '20px' }}></div>
              Génération du fichier...
            </div>
          )}
          
          <div style={{ marginTop: '16px', width: '100%' }}>
            <small style={{ color: 'var(--on-background)' }}>
              <strong>Formats disponibles:</strong> CSV (compatible Excel) • JSON (données brutes) • 
              <strong> Compatible:</strong> Excel, LibreOffice, Google Sheets
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDonnees;