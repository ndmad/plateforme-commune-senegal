// components/CarteCommunaleTablette.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// IMPORT DES ICÔNES LUCIDE
import Icons, { IconWrapper } from './Icons';

// ============================================================================
// CONFIGURATION DES ICÔNES LEAFLET
// ============================================================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// URL de base de votre backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ============================================================================
// CACHE POUR LES CONTOURS
// ============================================================================
const contoursCache = new Map();

// FONCTION AMÉLIORÉE POUR RÉCUPÉRER LES CONTOURS
const fetchCommuneBoundaries = async (communeId) => {
  console.log(`📍 Tentative de récupération des contours pour commune ID: ${communeId}`);

  // Vérifier le cache d'abord
  if (contoursCache.has(communeId)) {
    console.log('📦 Contours récupérés depuis le cache');
    return contoursCache.get(communeId);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/communes/${communeId}/contours`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Statut HTTP: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`⚠️ Aucun contour trouvé pour la commune ${communeId}`);
        // Stocker null dans le cache pour éviter de refaire la requête
        contoursCache.set(communeId, null);
        return null;
      }
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📨 Réponse API contours:', result);

    if (result.success && result.data) {
      console.log(`✅ Contours reçus pour: ${result.data.nom || 'Commune inconnue'}`);
      contoursCache.set(communeId, result.data);
      return result.data;
    } else {
      console.warn('⚠️ Réponse API sans données de contours:', result.error);
      contoursCache.set(communeId, null);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur récupération contours:', error);

    // Gestion spécifique des erreurs
    if (error.name === 'TypeError') {
      console.error('🌐 Erreur réseau - Vérifiez la connexion');
    }

    return null;
  }
};

// ============================================================================
// COMPOSANT RECHERCHE COMMUNES OPTIMISÉ TABLETTE
// ============================================================================
const searchCommunesAPI = async (searchTerm) => {
  try {
    const response = await fetch(`${API_BASE_URL}/communes/search/${encodeURIComponent(searchTerm)}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success) return result.data;
    }
    return [];
  } catch (error) {
    console.error('Erreur recherche communes:', error);
    return [];
  }
};

const SearchBarCommunes = ({ onCommuneSelect, communesData = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term.trim() || term.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const localResults = communesData.filter(commune =>
        commune.nom.toLowerCase().includes(term.toLowerCase()) ||
        (commune.region && commune.region.toLowerCase().includes(term.toLowerCase()))
      ).slice(0, 8); // Plus de résultats sur tablette

      setResults(localResults);
      setShowResults(true);

      const apiResults = await searchCommunesAPI(term);
      if (apiResults && apiResults.length > 0) {
        setResults(apiResults);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCommune = async (commune) => {
    setSearchTerm('⏳ Chargement...');
    setShowResults(false);

    try {
      if (commune.id) {
        const contours = await fetchCommuneBoundaries(commune.id);
        if (contours) {
          commune = { ...commune, ...contours };
        }
      }
      if (onCommuneSelect) onCommuneSelect(commune);
      setSearchTerm('');
      setIsFocused(false);
    } catch (error) {
      console.error('Erreur:', error);
      setSearchTerm(commune.nom);
      setShowResults(false);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '15px', // Plus d'espace en haut sur tablette
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: '85%', // Légèrement plus large sur tablette
      maxWidth: '500px' // Maximum pour tablette
    }}>
      <input
        type="text"
        placeholder="🔍 Rechercher une commune..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        style={{
          width: '100%',
          padding: '14px 18px', // Plus grand padding sur tablette
          borderRadius: '25px', // Bordures plus arrondies
          border: `3px solid ${isFocused ? '#00a651' : '#00853f'}`, // Bordure plus épaisse
          fontSize: '16px', // Texte plus grand
          boxShadow: isFocused ? '0 6px 20px rgba(0,133,63,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
          outline: 'none',
          background: 'white',
          transition: 'all 0.3s ease',
        }}
      />

      {isSearching && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '18px', // Ajusté pour le padding plus grand
          transform: 'translateY(-50%)',
          color: '#00853f',
          fontSize: '16px' // Plus grand
        }}>
          ⏳
        </div>
      )}

      {showResults && results.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '15px', // Plus arrondi
          marginTop: '8px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          maxHeight: '300px', // Plus haut sur tablette
          overflowY: 'auto',
          border: '2px solid #e0e0e0'
        }}>
          {results.map((commune, index) => (
            <div
              key={commune.id || index}
              onClick={() => handleSelectCommune(commune)}
              style={{
                padding: '14px 16px', // Plus d'espace
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px' // Plus d'espace entre les éléments
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
              }}
            >
              <div style={{
                width: '40px', // Plus grand
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00853f, #00a651)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px', // Plus grand
                color: 'white'
              }}>
                🏛️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>{commune.nom}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{commune.region}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SYSTÈME DE TRACKING GPS (identique au mobile)
// ============================================================================

// Service de tracking GPS
class GPSTrackingService {
  constructor() {
    this.watchId = null;
    this.positions = [];
    this.startTime = null;
    this.listeners = new Set();
    this.isTracking = false;
  }

  startTracking() {
    if (!navigator.geolocation) {
      console.error('Geolocation non supportée');
      return false;
    }

    this.positions = [];
    this.startTime = new Date();
    this.isTracking = true;

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      options
    );

    this.notifyListeners();
    return true;
  }

  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.notifyListeners();

    return this.getTrackSummary();
  }

  handlePosition(position) {
    const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
    const timestamp = new Date(position.timestamp);

    const positionData = {
      lat: latitude,
      lng: longitude,
      accuracy,
      altitude: altitude || 0,
      speed: speed || 0,
      heading: heading || 0,
      timestamp,
      timeElapsed: Date.now() - this.startTime.getTime()
    };

    this.positions.push(positionData);
    this.notifyListeners();
  }

  handleError(error) {
    console.error('Erreur GPS:', error);
    this.notifyListeners({ error: error.message });
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners(data = {}) {
    this.listeners.forEach(listener => {
      listener({
        isTracking: this.isTracking,
        positions: [...this.positions],
        startTime: this.startTime,
        ...data
      });
    });
  }

  getTrackSummary() {
    if (this.positions.length === 0) return null;

    const firstPos = this.positions[0];
    const lastPos = this.positions[this.positions.length - 1];

    // Calcul de la distance totale (approximative)
    let totalDistance = 0;
    for (let i = 1; i < this.positions.length; i++) {
      totalDistance += this.calculateDistance(
        this.positions[i - 1].lat, this.positions[i - 1].lng,
        this.positions[i].lat, this.positions[i].lng
      );
    }

    const duration = lastPos.timeElapsed;
    const avgSpeed = totalDistance / (duration / 1000); // m/s

    return {
      positions: [...this.positions],
      startTime: this.startTime,
      endTime: new Date(),
      totalDistance: totalDistance / 1000, // en km
      duration: duration / 1000, // en secondes
      avgSpeed: avgSpeed * 3.6, // en km/h
      maxSpeed: Math.max(...this.positions.map(p => p.speed * 3.6)) // en km/h
    };
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Instance globale du service de tracking
const gpsTrackingService = new GPSTrackingService();

// ============================================================================
// SELECTEUR DE MODE DE TRANSPORT OPTIMISÉ TABLETTE
// ============================================================================

const TransportModeSelector = ({ selectedMode, onModeChange, isTracking }) => {
  const transportModes = [
    { id: 'walking', icon: '🚶', label: 'Marche', color: '#00853f' },
    { id: 'cycling', icon: '🚴', label: 'Vélo', color: '#007AFF' },
    { id: 'driving', icon: '🚗', label: 'Voiture', color: '#FF6B35' },
    { id: 'motorcycle', icon: '🏍️', label: 'Moto', color: '#5856D6' },
    { id: 'public', icon: '🚌', label: 'Transport', color: '#FF9500' }
  ];

  if (!isTracking) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '85px', // Ajusté pour la barre de recherche plus grande
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.98)', // Plus opaque
      borderRadius: '20px', // Plus arrondi
      padding: '12px 18px', // Plus d'espace
      boxShadow: '0 6px 25px rgba(0,0,0,0.25)',
      border: '2px solid #e0e0e0',
      backdropFilter: 'blur(15px)'
    }}>
      <div style={{
        fontSize: '14px', // Plus grand
        fontWeight: '700',
        color: '#00853f',
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        🎯 Mode de déplacement
      </div>

      <div style={{
        display: 'flex',
        gap: '10px', // Plus d'espace
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {transportModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            style={{
              width: '50px', // Plus grand
              height: '50px',
              borderRadius: '12px', // Plus arrondi
              background: selectedMode === mode.id ? mode.color : 'white',
              border: `3px solid ${selectedMode === mode.id ? mode.color : '#e0e0e0'}`,
              color: selectedMode === mode.id ? 'white' : mode.color,
              fontSize: '18px', // Plus grand
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexDirection: 'column',
              padding: 0
            }}
            title={mode.label}
          >
            {mode.icon}
            <div style={{
              fontSize: '10px', // Plus grand
              marginTop: '3px',
              opacity: selectedMode === mode.id ? 1 : 0.7,
              fontWeight: 'bold'
            }}>
              {selectedMode === mode.id ? '✓' : ''}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT TRACKING GPS OPTIMISÉ TABLETTE
// ============================================================================

const GPSTrackingControl = ({ onTrackingUpdate, onTrackSaved }) => {
  const map = useMap();
  const [trackingState, setTrackingState] = useState({
    isTracking: false,
    positions: [],
    startTime: null,
    currentTrack: null,
    showStats: true
  });

  useEffect(() => {
    const handleTrackingUpdate = (data) => {
      setTrackingState(prev => ({
        ...prev,
        isTracking: data.isTracking,
        positions: data.positions,
        startTime: data.startTime
      }));

      if (onTrackingUpdate) {
        onTrackingUpdate(data);
      }

      // Centrer la carte sur la dernière position si en tracking
      if (data.isTracking && data.positions.length > 0) {
        const lastPos = data.positions[data.positions.length - 1];
        map.setView([lastPos.lat, lastPos.lng], map.getZoom());
      }
    };

    gpsTrackingService.addListener(handleTrackingUpdate);
    return () => gpsTrackingService.removeListener(handleTrackingUpdate);
  }, [map, onTrackingUpdate]);

  const toggleStats = () => {
    setTrackingState(prev => ({ ...prev, showStats: !prev.showStats }));
  };

  const startTracking = () => {
    const success = gpsTrackingService.startTracking();
    if (!success) {
      alert('Erreur: GPS non disponible');
    }
  };

  const stopTracking = () => {
    const trackSummary = gpsTrackingService.stopTracking();
    setTrackingState(prev => ({ ...prev, currentTrack: trackSummary, showStats: true }));

    if (trackSummary && onTrackSaved) {
      onTrackSaved(trackSummary);
    }
  };

  const saveTrack = async (trackType = 'walking') => {
    if (!trackingState.currentTrack) return;

    const trackToSave = {
      ...trackingState.currentTrack,
      type: trackType,
      name: `Collecte ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      savedAt: new Date()
    };

    try {
      // Sauvegarde locale
      const savedTracks = JSON.parse(localStorage.getItem('savedTracks') || '[]');
      savedTracks.push(trackToSave);
      localStorage.setItem('savedTracks', JSON.stringify(savedTracks));

      // Sauvegarde serveur (optionnelle)
      const response = await fetch(`${API_BASE_URL}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackToSave)
      });

      if (response.ok) {
        // Notification discrète pour agents municipaux
        L.popup()
          .setLatLng(map.getCenter())
          .setContent(`
            <div style="text-align: center; padding: 12px; min-width: 250px;">
              <div style="font-size: 28px; margin-bottom: 8px;">✅</div>
              <strong style="color: #00853f; font-size: 16px;">Trajet sauvegardé</strong><br/>
              <small style="font-size: 13px;">Prêt pour le rapport</small>
            </div>
          `)
          .openOn(map);

        setTrackingState(prev => ({ ...prev, currentTrack: null }));
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      // Sauvegarde locale de secours
      L.popup()
        .setLatLng(map.getCenter())
        .setContent(`
          <div style="text-align: center; padding: 12px; min-width: 250px;">
            <div style="font-size: 28px; margin-bottom: 8px;">📱</div>
            <strong style="color: #00853f; font-size: 16px;">Sauvegardé localement</strong><br/>
            <small style="font-size: 13px;">Sync au prochain réseau</small>
          </div>
        `)
        .openOn(map);
    }
  };

  return (
    <>
      {/* Indicateur de tracking compact - optimisé tablette */}
      {trackingState.isTracking && (
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          zIndex: 1000,
          background: 'rgba(255, 107, 53, 0.98)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: '700',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(15px)',
          border: '2px solid #FF6B35'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#00ff00',
            animation: 'pulse 1s infinite'
          }} />
          <span>🎯 Tracking Actif</span>
          <button
            onClick={toggleStats}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              color: 'white',
              borderRadius: '15px',
              width: '24px',
              height: '24px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
            title={trackingState.showStats ? "Masquer les stats" : "Afficher les stats"}
          >
            {trackingState.showStats ? '−' : '+'}
          </button>
        </div>
      )}

      {/* Statistiques de tracking (masquables) - optimisé tablette */}
      {trackingState.isTracking && trackingState.showStats && trackingState.positions.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '15px',
          right: '15px',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '15px',
          padding: '15px',
          zIndex: 1000,
          boxShadow: '0 6px 25px rgba(0,0,0,0.3)',
          border: '2px solid #FF6B35',
          backdropFilter: 'blur(15px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#FF6B35', fontSize: '15px' }}>
              📊 Statistiques Trajet
            </strong>
            <button
              onClick={toggleStats}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0',
                width: '24px',
                height: '24px',
                fontWeight: 'bold'
              }}
              title="Masquer"
            >
              ✕
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '13px'
          }}>
            <div>
              <strong>Distance:</strong> {(trackingState.positions.reduce((total, pos, i, arr) => {
                if (i === 0) return 0;
                const prev = arr[i - 1];
                return total + gpsTrackingService.calculateDistance(prev.lat, prev.lng, pos.lat, pos.lng);
              }, 0) / 1000).toFixed(2)} km
            </div>
            <div>
              <strong>Durée:</strong> {Math.floor((trackingState.positions[trackingState.positions.length - 1]?.timeElapsed || 0) / 60000)}min
            </div>
            <div>
              <strong>Points:</strong> {trackingState.positions.length}
            </div>
            <div>
              <strong>Vitesse:</strong> {(trackingState.positions[trackingState.positions.length - 1]?.speed * 3.6 || 0).toFixed(1)} km/h
            </div>
          </div>
        </div>
      )}

      {/* Popup de sauvegarde optimisé tablette */}
      {trackingState.currentTrack && !trackingState.isTracking && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '15px',
          right: '15px',
          background: 'white',
          borderRadius: '15px',
          padding: '15px',
          zIndex: 1000,
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          border: '3px solid #00853f'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <div>
              <h4 style={{ margin: 0, color: '#00853f', fontSize: '16px' }}>
                Trajet Enregistré
              </h4>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Prêt pour le rapport terrain
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '12px',
            fontSize: '13px',
            background: '#f8f9fa',
            padding: '12px',
            borderRadius: '10px'
          }}>
            <div><strong>📏</strong> {trackingState.currentTrack.totalDistance.toFixed(2)} km</div>
            <div><strong>⏱️</strong> {Math.floor(trackingState.currentTrack.duration / 60)}min</div>
            <div><strong>🚀</strong> {trackingState.currentTrack.avgSpeed.toFixed(1)} km/h</div>
            <div><strong>📈</strong> {trackingState.currentTrack.maxSpeed.toFixed(1)} km/h</div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => saveTrack('walking')}
              style={{
                flex: 1,
                padding: '12px',
                background: '#00853f',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              💾 Sauvegarder
            </button>
            <button
              onClick={() => setTrackingState(prev => ({ ...prev, currentTrack: null }))}
              style={{
                padding: '12px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// COMPOSANT POUR AFFICHER LES TRAJETS SAUVEGARDÉS OPTIMISÉ TABLETTE
// ============================================================================

const SavedTracksControl = ({ isOpen, onClose }) => {
  const [savedTracks, setSavedTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);

  useEffect(() => {
    loadSavedTracks();
  }, []);

  const loadSavedTracks = () => {
    const tracks = JSON.parse(localStorage.getItem('savedTracks') || '[]');
    setSavedTracks(tracks);
  };

  const deleteTrack = (index) => {
    const newTracks = savedTracks.filter((_, i) => i !== index);
    setSavedTracks(newTracks);
    localStorage.setItem('savedTracks', JSON.stringify(newTracks));
  };

  const getActivityIcon = (type) => {
    const icons = {
      walking: '🚶',
      running: '🏃',
      cycling: '🚴',
      driving: '🚗',
      other: '🔍'
    };
    return icons[type] || '🔍';
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        zIndex: 1002,
        width: '90%',
        maxWidth: '500px', // Plus large sur tablette
        maxHeight: '80vh',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #00853f, #00a651)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>📁 Mes Trajets Sauvegardés</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '15px' }}>
          {savedTracks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '50px 20px',
              color: '#666'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>📁</div>
              <div style={{ fontSize: '16px' }}>Aucun trajet sauvegardé</div>
            </div>
          ) : (
            savedTracks.map((track, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  background: selectedTrack === index ? '#f0f9f0' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedTrack(selectedTrack === index ? null : index)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '24px' }}>
                    {getActivityIcon(track.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>
                      {track.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {new Date(track.savedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {selectedTrack === index && (
                  <div style={{
                    fontSize: '14px',
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '8px',
                    marginTop: '10px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>📏 {track.totalDistance.toFixed(2)} km</div>
                      <div>⏱️ {Math.floor(track.duration / 60)}min</div>
                      <div>🚀 {track.avgSpeed.toFixed(1)} km/h</div>
                      <div>📈 {track.maxSpeed.toFixed(1)} km/h max</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTrack(index);
                      }}
                      style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '10px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 1001
        }}
        onClick={onClose}
      />
    </>
  );
};

// ============================================================================
// COMPOSANTS BOUTONS FLOTTANTS TABLETTE
// ============================================================================

// COMPOSANT BOUTON FLOTTANT TABLETTE
const FloatingButton = ({ 
  icon, 
  title, 
  onClick, 
  color = '#00853f', 
  isActive = false, 
  badge, 
  style = {} 
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: '50px',
        height: '50px',
        borderRadius: '12px',
        background: isActive ? color : 'white',
        border: `3px solid ${isActive ? color : '#e0e0e0'}`,
        color: isActive ? 'white' : color,
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        position: 'absolute',
        zIndex: 1000,
        ...style
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.35)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.25)';
      }}
      title={title}
    >
      {icon}
      {badge && (
        <span style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          background: '#ff3b30',
          color: 'white',
          borderRadius: '10px',
          width: '18px',
          height: '18px',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          border: '2px solid white'
        }}>
          {badge}
        </span>
      )}
    </button>
  );
};

// COMPOSANT ZOOM PERSONNALISÉ STYLE QFIELD OPTIMISÉ TABLETTE - CORRIGÉ
const CustomZoomControlQField = () => {
  const map = useMap();

  return (
    <div style={{
      position: 'absolute',
      right: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
      overflow: 'hidden',
      border: '2px solid #e0e0e0',
      gap: '0'
    }}>
      <button
        onClick={() => map.zoomIn()}
        style={{
          width: '50px',
          height: '50px',
          border: 'none',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          color: '#00853f',
          padding: 0
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'white';
        }}
        title="Zoom avant"
      >
        <IconWrapper icon={Icons.zoomIn} />
      </button>

      <div style={{
        height: '2px',
        background: '#e0e0e0',
        margin: '0 8px'
      }} />

      <button
        onClick={() => map.zoomOut()}
        style={{
          width: '50px',
          height: '50px',
          border: 'none',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          color: '#00853f',
          padding: 0
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'white';
        }}
        title="Zoom arrière"
      >
        <IconWrapper icon={Icons.zoomOut} />
      </button>
    </div>
  );
};

// ============================================================================
// AUTRES COMPOSANTS OPTIMISÉS TABLETTE
// ============================================================================

// COMPOSANT LOCALISATION OPTIMISÉ TABLETTE
const LocateControl = ({ onLocatingChange, onLocate }) => {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const locateUser = () => {
    console.log('📍 Début de la géolocalisation tablette...');

    if (!navigator.geolocation) {
      console.error('❌ Géolocalisation non supportée par le navigateur');
      L.popup()
        .setLatLng(map.getCenter())
        .setContent(`
          <div style="text-align: center; padding: 15px; min-width: 280px;">
            <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
            <strong style="color: #dc2626; font-size: 16px;">Géolocalisation non supportée</strong><br/>
            <small style="font-size: 13px;">Votre navigateur ne supporte pas la géolocalisation</small>
          </div>
        `).openOn(map);
      return;
    }

    setIsLocating(true);
    if (onLocatingChange) onLocatingChange(true);

    // Options optimisées pour tablette
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Un peu plus long sur tablette
      maximumAge: 60000
    };

    console.log('📍 Demande de position avec options:', options);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('✅ Position obtenue:', { latitude, longitude, accuracy });

        // Centrer la carte sur la position
        map.setView([latitude, longitude], 16);

        // Supprimer l'ancien marqueur
        if (window.currentLocationMarker) {
          map.removeLayer(window.currentLocationMarker);
        }

        // Créer un marqueur de position avec précision - optimisé tablette
        window.currentLocationMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            html: `
              <div style="position: relative; width: 28px; height: 28px;">
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 28px;
                  height: 28px;
                  background: rgba(0, 122, 255, 0.4);
                  border: 3px solid #007AFF;
                  border-radius: 50%;
                  animation: ripple 2s infinite;
                "></div>
                <div style="
                  position: absolute;
                  top: 5px;
                  left: 5px;
                  width: 18px;
                  height: 18px;
                  background: #007AFF;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                "></div>
              </div>
            `,
            className: 'tablet-location-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })
        }).addTo(map).bindPopup(`
          <div style="text-align: center; padding: 12px; min-width: 250px;">
            <strong style="font-size: 16px;">📍 Votre position</strong><br>
            <small style="font-size: 13px;">Lat: ${latitude.toFixed(6)}°</small><br>
            <small style="font-size: 13px;">Lng: ${longitude.toFixed(6)}°</small><br>
            <small style="font-size: 13px;">Précision: ±${accuracy ? Math.round(accuracy) : '?'}m</small>
          </div>
        `).openPopup();

        setIsLocating(false);
        if (onLocatingChange) onLocatingChange(false);
      },
      (error) => {
        console.error('❌ Erreur géolocalisation:', error);
        setIsLocating(false);
        if (onLocatingChange) onLocatingChange(false);

        let errorMessage = 'Erreur inconnue';
        let errorDetails = '';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission de géolocalisation refusée';
            errorDetails = `
              <div style="text-align: left; margin-top: 10px; font-size: 13px;">
                <strong>Pour résoudre :</strong><br>
                • Vérifiez les permissions de votre navigateur<br>
                • Utilisez HTTPS (obligatoire pour la géolocalisation)<br>
                • Autorisez la géolocalisation dans les paramètres
              </div>
            `;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible';
            errorDetails = 'Vérifiez que votre GPS est activé et que vous avez une connexion réseau';
            break;
          case error.TIMEOUT:
            errorMessage = 'Temps écoulé';
            errorDetails = 'La localisation a pris trop de temps. Réessayez';
            break;
        }

        L.popup()
          .setLatLng(map.getCenter())
          .setContent(`
            <div style="text-align: center; padding: 15px; max-width: 320px;">
              <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
              <strong style="color: #dc2626; font-size: 16px;">${errorMessage}</strong><br/>
              <div style="margin-top: 10px; font-size: 13px; color: #666; text-align: left;">
                ${errorDetails}
              </div>
            </div>
          `).openOn(map);
      },
      options
    );
  };

  useEffect(() => {
    if (onLocate && onLocate > 0) {
      console.log('📍 Déclenchement de la localisation via bouton');
      locateUser();
    }
  }, [onLocate]);

  return null;
};

// COMPOSANT SÉLECTEUR DE FOND DE CARTE STYLE QFIELD OPTIMISÉ TABLETTE
const QFieldLayersControl = ({ onBasemapChange, isOpen, onClose }) => {
  const [basemap, setBasemap] = useState('osm');

  const handleBasemapChange = (newBasemap) => {
    setBasemap(newBasemap);
    if (onBasemapChange) onBasemapChange(newBasemap);
    if (onClose) onClose();
  };

  const basemapOptions = [
    { value: 'osm', label: <IconWrapper icon={Icons.map} />, name: 'Carte Standard' },
    { value: 'satellite', label: <IconWrapper icon={Icons.satellite} />, name: 'Satellite' },
    { value: 'topo', label: '⛰️', name: 'Topographique' }
  ];

  if (!isOpen) return null;

  return (
    <>
      <div style={{
        position: 'absolute',
        right: '15px',
        top: '85px',
        background: 'white',
        borderRadius: '15px',
        boxShadow: '0 6px 25px rgba(0,0,0,0.3)',
        zIndex: 1001,
        overflow: 'hidden',
        border: '2px solid #e0e0e0',
        minWidth: '200px', // Plus large
        backdropFilter: 'blur(15px)'
      }}>
        <div style={{
          padding: '15px 18px',
          background: 'linear-gradient(135deg, #00853f, #00a651)',
          color: 'white',
          fontSize: '15px',
          fontWeight: '700',
          textAlign: 'center',
          borderBottom: '2px solid #e0e0e0'
        }}>
          <IconWrapper icon={Icons.layers} style={{ marginRight: '8px' }} />
          Fonds de carte
        </div>

        {basemapOptions.map((option, index) => (
          <button
            key={option.value}
            onClick={() => handleBasemapChange(option.value)}
            style={{
              width: '100%',
              padding: '15px 18px',
              background: basemap === option.value ? '#f0f9f0' : 'white',
              border: 'none',
              borderBottom: index < basemapOptions.length - 1 ? '2px solid #f0f0f0' : 'none',
              fontSize: '15px',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = basemap === option.value ? '#f0f9f0' : 'white';
            }}
          >
            <span style={{
              fontSize: '20px',
              filter: basemap === option.value ? 'none' : 'grayscale(20%)'
            }}>
              {option.label}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: basemap === option.value ? '700' : '600',
                color: basemap === option.value ? '#00853f' : '#333'
              }}>
                {option.name}
              </div>
            </div>
            {basemap === option.value && (
              <span style={{
                fontSize: '18px',
                color: '#00853f',
                fontWeight: 'bold'
              }}>✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Overlay pour fermer le menu */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.2)'
        }}
        onClick={onClose}
      />
    </>
  );
};

// COMPOSANT CONTRÔLEUR DE CARTE
const MapController = () => {
  const map = useMap();
  useEffect(() => {
    console.log('📱 Carte tablette avec tracking GPS initialisée');
  }, [map]);
  return null;
};

// ============================================================================
// CONFIGURATION DES FONDS DE CARTE
// ============================================================================
const BASEMAPS = {
  osm: {
    name: 'Carte Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; ArcGIS'
  },
  topo: {
    name: 'Topographique',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap'
  }
};

// COMPOSANT COUCHE DE CARTE DYNAMIQUE
const DynamicTileLayer = ({ basemap }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [basemap, map]);

  const currentBasemap = BASEMAPS[basemap] || BASEMAPS.osm;
  return <TileLayer attribution={currentBasemap.attribution} url={currentBasemap.url} />;
};

// ============================================================================
// CONFIGURATION DES ICÔNES ET POPUPS TABLETTE
// ============================================================================
const creerIcone = (couleur) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${couleur}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [30, 48], // Plus grand sur tablette
  iconAnchor: [15, 48],
  popupAnchor: [1, -40],
  shadowSize: [48, 48]
});

const icones = {
  'Agricole': creerIcone('green'),
  'Hydrique': creerIcone('blue'),
  'Commerciale': creerIcone('violet'),
  'Artisanale': creerIcone('orange'),
  'Touristique': creerIcone('red'),
  'Minérale': creerIcone('black'),
  'default': creerIcone('grey')
};

// Popup tablette optimisée
const TabletPopup = ({ ressource }) => (
  <div style={{ padding: '12px', maxWidth: '280px' }}>
    <h6 style={{ margin: '0 0 8px 0', color: '#00853f', fontSize: '16px' }}>{ressource.nom}</h6>
    <div style={{ marginBottom: '6px', fontSize: '14px' }}>
      <strong>Type:</strong> {ressource.type}
    </div>
    <div style={{ marginBottom: '6px', fontSize: '14px' }}>
      <strong>Potentiel:</strong>
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        marginLeft: '6px',
        background: ressource.potentiel === 'élevé' ? '#dcfce7' :
          (ressource.potentiel === 'moyen' ? '#fef9c3' : '#f3f4f6'),
        color: ressource.potentiel === 'élevé' ? '#166534' :
          (ressource.potentiel === 'moyen' ? '#854d0e' : '#374151')
      }}>
        {ressource.potentiel}
      </span>
    </div>
    <div style={{ marginBottom: '8px', fontSize: '14px' }}>
      <strong>État:</strong> {ressource.etat_utilisation}
    </div>
    {ressource.description && (
      <div style={{
        marginTop: '8px',
        color: '#666',
        fontSize: '13px',
        borderTop: '2px solid #f0f0f0',
        paddingTop: '8px'
      }}>
        {ressource.description.substring(0, 120)}...
      </div>
    )}
  </div>
);

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================
const obtenirCoordonnees = (ressource) => {
  if (ressource.localisation && ressource.localisation.coordinates) {
    const [lng, lat] = ressource.localisation.coordinates;
    return [lat, lng];
  }
  if (ressource.latitude && ressource.longitude) {
    const lat = parseFloat(ressource.latitude);
    const lng = parseFloat(ressource.longitude);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  return [14.7167, -17.4677];
};

const getIconForRessource = (typeRessource) => icones[typeRessource] || icones.default;

const parseCoordinates = (commune) => {
  let lat, lng;

  if (commune.latitude !== undefined && commune.longitude !== undefined) {
    lat = parseFloat(commune.latitude);
    lng = parseFloat(commune.longitude);
  }

  if (isNaN(lat) || isNaN(lng)) {
    return [14.7167, -17.4677];
  }

  if (lat < 12 || lat > 17 || lng < -18 || lng > -11) {
    return [14.7167, -17.4677];
  }

  return [lat, lng];
};

// ============================================================================
// COMPOSANT PRINCIPAL TABLETTE AVEC SYSTÈME DE TRACKING
// ============================================================================
const CarteCommunaleTablette = ({
  ressources,
  communes,
  onCommuneSelect,
  onAddDataClick,
  formulairePosition
}) => {
  const positionDefaut = [14.7167, -17.4677];
  const mapRef = useRef();
  const [cartePrete, setCartePrete] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('osm');
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showTracksMenu, setShowTracksMenu] = useState(false);
  const [locateTrigger, setLocateTrigger] = useState(0);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingPositions, setTrackingPositions] = useState([]);
  const [trackingMode, setTrackingMode] = useState('walking');
  const [temporaryMarker, setTemporaryMarker] = useState(null);

  // ============================================================================
  // GESTIONNAIRE DE SÉLECTION AMÉLIORÉ - CORRIGÉ
  // ============================================================================
  const handleCommuneSelect = useCallback(async (commune) => {
    if (!mapRef.current) return;
  
    try {
      let coordinates = parseCoordinates(commune);
      console.log('📍 Coordonnées de la commune:', coordinates);
  
      // Nettoyer les marqueurs précédents
      if (window.communeMarker && mapRef.current.hasLayer(window.communeMarker)) {
        mapRef.current.removeLayer(window.communeMarker);
      }
      if (window.communeBoundaryLayer && mapRef.current.hasLayer(window.communeBoundaryLayer)) {
        mapRef.current.removeLayer(window.communeBoundaryLayer);
      }
  
      let boundaries = null;
      let communeData = commune;
  
      // Récupérer les contours si disponible - AVEC GESTION D'ERREUR AMÉLIORÉE
      if (communeData.id) {
        console.log(`🔄 Récupération des contours pour ID: ${communeData.id}`);
        try {
          const apiData = await fetchCommuneBoundaries(communeData.id);
          if (apiData) {
            communeData = { ...communeData, ...apiData };
            
            // Extraction des géométries selon différentes structures possibles
            if (apiData.geometrie) {
              boundaries = apiData.geometrie;
            } else if (apiData.features) {
              boundaries = apiData;
            } else if (apiData.geometry) {
              boundaries = apiData;
            }
            
            console.log('✅ Contours disponibles:', boundaries ? 'OUI' : 'NON');
            
            if (apiData.latitude && apiData.longitude) {
              coordinates = [apiData.latitude, apiData.longitude];
              console.log('📍 Coordonnées mises à jour via API');
            }
          } else {
            console.log('ℹ️ Aucun contour disponible pour cette commune');
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération des contours:', error);
        }
      }
  
      // Afficher les contours si disponibles
      if (boundaries) {
        console.log('🎨 Affichage des contours administratifs:', boundaries);
        
        try {
          window.communeBoundaryLayer = L.geoJSON(boundaries, {
            style: {
              color: '#00853f',
              weight: 4, // Plus épais sur tablette
              opacity: 0.8,
              fillColor: '#00853f',
              fillOpacity: 0.15,
              dashArray: '5, 5'
            },
            onEachFeature: function (feature, layer) {
              // Ajouter un tooltip avec le nom de la commune
              if (feature.properties && feature.properties.nom) {
                layer.bindTooltip(feature.properties.nom, {
                  permanent: false,
                  direction: 'center',
                  className: 'commune-tooltip-tablette'
                });
              }
            }
          }).addTo(mapRef.current);
  
          const bounds = window.communeBoundaryLayer.getBounds();
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [25, 25] }); // Plus de padding
            console.log('🎯 Vue ajustée aux contours');
          } else {
            console.warn('⚠️ Bounds invalides, centrage sur coordonnées');
            mapRef.current.setView(coordinates, 12);
          }
        } catch (geoJsonError) {
          console.error('❌ Erreur création GeoJSON:', geoJsonError);
          mapRef.current.setView(coordinates, 12);
        }
      } else {
        console.log('🎯 Centrage sur coordonnées de la commune (pas de contours)');
        mapRef.current.setView(coordinates, 12);
      }
  
      // Ajouter le marqueur de la commune - optimisé tablette
      window.communeMarker = L.marker(coordinates, {
        icon: L.divIcon({
          html: `<div style="background: #00853f; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; border: 4px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4);">🏛️</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(mapRef.current).bindPopup(`
        <div style="padding: 15px; text-align: center; min-width: 280px;">
          <strong style="color: #00853f; font-size: 18px;">🏛️ ${communeData.nom}</strong><br/>
          <div style="margin-top: 10px; text-align: left; font-size: 14px;">
            <small><strong>Région:</strong> ${communeData.region || 'Non spécifiée'}</small><br/>
            ${communeData.departement ? `<small><strong>Département:</strong> ${communeData.departement}</small><br/>` : ''}
            ${boundaries ? 
              '<small style="color: #00853f; font-size: 13px;"><strong>✅ Contours administratifs disponibles</strong></small>' : 
              '<small style="color: #dc2626; font-size: 13px;"><strong>❌ Contours non disponibles</strong></small>'
            }
          </div>
        </div>
      `).openPopup();
  
      setSelectedCommune(communeData);
      console.log('✅ Commune affichée avec succès');
  
    } catch (error) {
      console.error('❌ Erreur affichage commune:', error);
      
      // Message d'erreur utilisateur
      L.popup()
        .setLatLng(mapRef.current.getCenter())
        .setContent(`
          <div style="text-align: center; padding: 15px; min-width: 280px;">
            <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
            <strong style="color: #dc2626; font-size: 16px;">Erreur d'affichage</strong><br/>
            <small style="font-size: 13px;">Impossible d'afficher les données de la commune: ${error.message}</small>
          </div>
        `).openOn(mapRef.current);
    }
  
    if (onCommuneSelect) onCommuneSelect(commune);
  }, [onCommuneSelect]);
  
  // Gestion du tracking GPS
  const handleTrackingUpdate = useCallback((data) => {
    setIsTracking(data.isTracking);
    setTrackingPositions(data.positions);
  }, []);

  const handleTrackingClick = () => {
    if (isTracking) {
      gpsTrackingService.stopTracking();
    } else {
      gpsTrackingService.startTracking();
    }
  };

  const handleTrackSaved = (trackSummary) => {
    console.log('Trajet sauvegardé:', trackSummary);
  };

  const handleModeChange = (mode) => {
    setTrackingMode(mode);
  };

  // Gestion du clic sur le bouton Ajouter
  const handleAddButtonClick = () => {
    if (isAddingMode) {
      setIsAddingMode(false);
      if (temporaryMarker && mapRef.current) {
        mapRef.current.removeLayer(temporaryMarker);
      }
      setTemporaryMarker(null);
    } else {
      setIsAddingMode(true);

      L.popup()
        .setLatLng(mapRef.current.getCenter())
        .setContent(`
          <div style="text-align: center; padding: 18px; min-width: 280px;">
            <div style="font-size: 28px; margin-bottom: 12px;">📍</div>
            <strong style="color: #00853f; font-size: 18px;">Mode Ajout Activé</strong><br/>
            <small style="font-size: 14px;">Cliquez sur la carte pour placer la ressource</small>
          </div>
        `)
        .openOn(mapRef.current);
    }
  };

  // Gestion du clic sur la carte en mode ajout
  useEffect(() => {
    if (!mapRef.current || !isAddingMode) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;

      if (temporaryMarker && mapRef.current.hasLayer(temporaryMarker)) {
        mapRef.current.removeLayer(temporaryMarker);
      }

      // Marqueur temporaire optimisé tablette
      const newMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<div style="background: #ff6b35; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; border: 4px solid white; box-shadow: 0 3px 12px rgba(0,0,0,0.5); animation: pulse 1.5s infinite;">📌</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(mapRef.current);

      setTemporaryMarker(newMarker);

      if (onAddDataClick) {
        onAddDataClick({ lat, lng });
      }

      setIsAddingMode(false);
    };

    mapRef.current.on('click', handleMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
    };
  }, [isAddingMode, temporaryMarker, onAddDataClick]);

  // Filtrage des ressources
  const ressourcesAvecCoordonnees = ressources ? ressources.filter(ressource => {
    const coords = obtenirCoordonnees(ressource);
    return coords && coords[0] !== positionDefaut[0] && coords[1] !== positionDefaut[1];
  }) : [];

  const handleLocateClick = () => {
    setLocateTrigger(prev => prev + 1);
  };

  const handleLayersClick = () => {
    setShowLayersMenu(true);
  };

  const handleTracksClick = () => {
    setShowTracksMenu(true);
  };

  // Nettoyage
  useEffect(() => {
    return () => {
      delete window.communeBoundaryLayer;
      delete window.communeMarker;
      delete window.formulaireMarker;
      delete window.currentLocationMarker;
    };
  }, []);

  return (
    <div className="carte-tablette-container" style={{
      height: '100%',
      width: '100%',
      position: 'relative'
    }}>

      {/* BARRE DE RECHERCHE OPTIMISÉE TABLETTE */}
      <SearchBarCommunes
        onCommuneSelect={handleCommuneSelect}
        communesData={communes}
      />

      {/* SELECTEUR DE MODE DE TRANSPORT OPTIMISÉ TABLETTE */}
      <TransportModeSelector
        selectedMode={trackingMode}
        onModeChange={handleModeChange}
        isTracking={isTracking}
      />

      {/* BOUTONS GAUCHE - Sous la barre de recherche */}
      {/* BOUTON TRACKING GPS */}
      <FloatingButton
        icon={<IconWrapper icon={isTracking ? Icons.x : Icons.locate} />}
        title={isTracking ? "Arrêter le tracking" : "Démarrer le tracking GPS"}
        onClick={handleTrackingClick}
        color={isTracking ? "#dc2626" : "#FF6B35"}
        isActive={isTracking}
        style={{
          top: '85px',
          left: '15px'
        }}
      />

      {/* BOUTON AJOUTER RESSOURCE */}
      <FloatingButton
        icon={isAddingMode ? 
          <IconWrapper icon={Icons.x} /> : 
          <IconWrapper icon={Icons.circlePlus} />
        }
        title={isAddingMode ? "Annuler l'ajout" : "Ajouter une ressource"}
        onClick={handleAddButtonClick}
        color={isAddingMode ? "#dc2626" : "#00853f"}
        isActive={isAddingMode}
        style={{
          top: '145px', // 85px + 50px + 10px d'espace
          left: '15px'
        }}
      />

      {/* BOUTON LOCALISATION */}
      <FloatingButton
        icon={<IconWrapper icon={Icons.locateFixed} />}
        title="Localiser ma position"
        onClick={handleLocateClick}
        color="#007AFF"
        isActive={isLocating}
        style={{
          top: '205px', // 145px + 50px + 10px d'espace
          left: '15px'
        }}
      />

      {/* BOUTON DROITE HAUT - Basemap */}
      <FloatingButton
        icon={<IconWrapper icon={Icons.layers} />}
        title="Changer le fond de carte"
        onClick={handleLayersClick}
        color="#5856D6"
        style={{
          top: '85px',
          right: '15px'
        }}
      />

      {/* BOUTON DROITE BAS - Trajets sauvegardés */}
      <FloatingButton
        icon={<IconWrapper icon={Icons.download} />}
        title="Mes trajets sauvegardés"
        onClick={handleTracksClick}
        color="#5856D6"
        style={{
          bottom: '200px',
          right: '15px'
        }}
      />

      {/* INDICATEUR DE MODE AJOUT OPTIMISÉ TABLETTE */}
      {isAddingMode && (
        <div style={{
          position: 'absolute',
          top: '85px',
          left: '75px', // Ajusté pour être à côté du bouton d'ajout
          zIndex: 1000,
          background: '#00853f',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: '700',
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'pulse 2s infinite',
          backdropFilter: 'blur(15px)',
          maxWidth: '250px'
        }}>
          <span>📍</span>
          Mode collecte activé - Cliquez sur la carte
        </div>
      )}

      {/* CONTENEUR DE LA CARTE */}
      <MapContainer
        center={positionDefaut}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
        whenReady={() => setCartePrete(true)}
      >

        {/* OUTILS TABLETTE - TOUS LES COMPOSANTS AVEC useMap() DOIVENT ÊTRE ICI */}
        <MapController />
        <LocateControl
          onLocatingChange={setIsLocating}
          onLocate={locateTrigger > 0}
        />
        <GPSTrackingControl
          onTrackingUpdate={handleTrackingUpdate}
          onTrackSaved={handleTrackSaved}
        />
        <CustomZoomControlQField />

        {/* LIGNE DU TRACKING EN TEMPS RÉEL */}
        {trackingPositions.length > 1 && (
          <Polyline
            positions={trackingPositions.map(pos => [pos.lat, pos.lng])}
            color={
              trackingMode === 'walking' ? '#00853f' :
                trackingMode === 'cycling' ? '#007AFF' :
                  trackingMode === 'driving' ? '#FF6B35' :
                    trackingMode === 'motorcycle' ? '#5856D6' : '#FF9500'
            }
            weight={6} // Plus épais sur tablette
            opacity={0.8}
            lineCap="round"
          />
        )}

        {/* MENU DES FONDS DE CARTE OPTIMISÉ TABLETTE */}
        <QFieldLayersControl
          onBasemapChange={setCurrentBasemap}
          isOpen={showLayersMenu}
          onClose={() => setShowLayersMenu(false)}
        />

        {/* FOND DE CARTE */}
        <DynamicTileLayer basemap={currentBasemap} />

        {/* MARQUEURS DES RESSOURCES AVEC POPUP TABLETTE */}
        {cartePrete && ressourcesAvecCoordonnees.map((ressource) => {
          const coords = obtenirCoordonnees(ressource);
          return (
            <Marker key={ressource.id} position={coords} icon={getIconForRessource(ressource.type)}>
              <Popup>
                <TabletPopup ressource={ressource} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* MENU DES TRAJETS SAUVEGARDÉS OPTIMISÉ TABLETTE (en dehors de MapContainer car n'utilise pas useMap) */}
      <SavedTracksControl
        isOpen={showTracksMenu}
        onClose={() => setShowTracksMenu(false)}
      />

      {/* STYLES OPTIMISÉS TABLETTE */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 
          0% { transform: scale(1); opacity: 1; } 
          50% { transform: scale(1.05); opacity: 0.8; } 
          100% { transform: scale(1); opacity: 1; } 
        }
        @keyframes ripple { 
          0% { transform: scale(1); opacity: 1; } 
          100% { transform: scale(3); opacity: 0; } 
        }
        
        .carte-tablette-container {
          animation: fadeIn 0.5s ease;
        }
        
        .commune-tooltip-tablette {
          background: rgba(0, 133, 63, 0.95);
          border: 2px solid #00853f;
          border-radius: 6px;
          color: white;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: bold;
        }
        
        .leaflet-tooltip.commune-tooltip-tablette {
          background: rgba(0, 133, 63, 0.95);
          border: 2px solid #00853f;
          color: white;
        }
        
        .tablet-location-marker {
          z-index: 1000;
        }
      `}</style>
    </div>
  );
};

export default CarteCommunaleTablette;