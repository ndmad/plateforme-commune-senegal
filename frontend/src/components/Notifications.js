import React, { createContext, useContext, useState } from 'react';

// Contexte pour les notifications
const NotificationContext = createContext();

// Hook personnalisé pour utiliser les notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Provider des notifications
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Ajouter une notification
  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Suppression automatique après la durée
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  // Supprimer une notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Vider toutes les notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Méthodes pratiques
  const success = (message, duration = 3000) => {
    return addNotification(message, 'success', duration);
  };

  const error = (message, duration = 5000) => {
    return addNotification(message, 'error', duration);
  };

  const warning = (message, duration = 4000) => {
    return addNotification(message, 'warning', duration);
  };

  const info = (message, duration = 4000) => {
    return addNotification(message, 'info', duration);
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* SUPPRIMER l'appel direct à NotificationContainer ici */}
    </NotificationContext.Provider>
  );
};

// Conteneur des notifications - CORRIGÉ
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px',
      width: '100%'
    }}>
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// Composant de notification individuelle
const NotificationToast = ({ notification, onClose }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getNotificationStyles = () => {
    const baseStyles = {
      padding: '16px',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--elevation-3)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'slideInRight 0.3s ease-out',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: isLeaving ? 'translateX(100%)' : 'translateX(0)',
      opacity: isLeaving ? 0 : 1
    };

    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        borderLeft: '4px solid #047857'
      },
      error: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        borderLeft: '4px solid #b91c1c'
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        borderLeft: '4px solid #b45309'
      },
      info: {
        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
        color: 'white',
        borderLeft: '4px solid var(--primary-700)'
      }
    };

    return { ...baseStyles, ...typeStyles[notification.type] };
  };

  const getIcon = () => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[notification.type] || '💡';
  };

  return (
    <div 
      style={getNotificationStyles()}
      onClick={handleClose}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = isLeaving ? 'translateX(100%)' : 'translateX(-5px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isLeaving ? 'translateX(100%)' : 'translateX(0)';
      }}
    >
      <div style={{ 
        fontSize: '18px',
        flexShrink: 0
      }}>
        {getIcon()}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600',
          lineHeight: '1.4'
        }}>
          {notification.message}
        </div>
        <div style={{ 
          fontSize: '11px',
          opacity: '0.8',
          marginTop: '4px'
        }}>
          {notification.timestamp.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          opacity: '0.7',
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
          e.currentTarget.style.background = 'none';
        }}
      >
        ✕
      </button>
    </div>
  );
};

// Export unique du conteneur
export default NotificationContainer;