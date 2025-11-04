import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import './LoginPage.css';
import { useTranslation } from '../hooks/useTranslation';

const LoginPage = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${t('login_success')}`);
        
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(result.data.user);
          }
        }, 1500);
      } else {
        setMessage('❌ ' + (result.error || t('login_error')));
      }
    } catch (error) {
      setMessage('❌ ' + t('connection_error'));
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-flutter" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--background) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="flutter-scale-in" style={{ width: '100%', maxWidth: '400px' }}>
        {/* Carte de connexion Flutter-like */}
        <div className="flutter-card elevated" style={{ 
          padding: '40px 32px',
          textAlign: 'center'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, var(--senegal-green), var(--primary-600))',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
              color: 'white',
              boxShadow: 'var(--elevation-2)'
            }}>
              🌍
            </div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              color: 'var(--on-surface)',
              marginBottom: '8px'
            }}>
              {t('municipality')} {t('platform')}
            </h1>
            <p style={{ 
              color: 'var(--on-background)',
              fontSize: '14px'
            }}>
              Sénégal - {t('territorial-management')}
            </p>
          </div>

          {/* Message d'alerte */}
          {message && (
            <div className={`flutter-fade-in ${message.includes('✅') ? 'alert-success' : 'alert-error'}`} style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              fontSize: '14px',
              background: message.includes('✅') ? 'var(--primary-50)' : '#fef2f2',
              color: message.includes('✅') ? 'var(--primary-700)' : '#dc2626',
              border: `1px solid ${message.includes('✅') ? 'var(--primary-200)' : '#fecaca'}`
            }}>
              {message}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: 'var(--on-surface)',
                fontSize: '14px'
              }}>
                {t('email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                required
                disabled={isLoading}
                className="flutter-input"
              />
            </div>

            <div style={{ marginBottom: '32px', textAlign: 'left' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: 'var(--on-surface)',
                fontSize: '14px'
              }}>
                {t('password')}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('password')}
                required
                disabled={isLoading}
                className="flutter-input"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="flutter-btn primary"
              style={{ width: '100%' }}
            >
              {isLoading ? (
                <>
                  <div className="flutter-spinner" style={{ 
                    width: '16px', 
                    height: '16px',
                    borderWidth: '2px'
                  }}></div>
                  {t('logging_in')}
                </>
              ) : (
                <>
                  <span>🔐</span>
                  {t('login')}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            <small style={{ 
              color: 'var(--on-background)',
              fontSize: '12px'
            }}>
              {t('restricted_access')}
            </small>
          </div>
        </div>

        {/* Footer global */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px',
          color: 'var(--on-background)',
          fontSize: '12px'
        }}>
          <p>&copy; 2024 {t('municipality')} {t('platform')} - Sénégal</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;