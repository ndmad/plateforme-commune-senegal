// src/components/Icons.js
import React from 'react';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  LocateFixed, 
  CirclePlus, 
  Download,
  Locate,
  Square,
  MapPin,
  FolderOpen,
  Satellite,
  Map,
  Navigation,
  Compass,
  X,
  FolderUp,
  Trash2,
  Printer,
  Fingerprint,
  SquaresIntersect
} from 'lucide-react';

export const Icons = {
  // Navigation et cartes
  layers: (props) => <Layers {...props} />,
  zoomIn: (props) => <ZoomIn {...props} />,
  zoomOut: (props) => <ZoomOut {...props} />,
  locateFixed: (props) => <LocateFixed {...props} />,
  locate: (props) => <Locate {...props} />,
  map: (props) => <Map {...props} />,
  satellite: (props) => <Satellite {...props} />,
  navigation: (props) => <Navigation {...props} />,
  compass: (props) => <Compass {...props} />,
  
  // Actions de collecte
  circlePlus: (props) => <CirclePlus {...props} />,
  download: (props) => <Download {...props} />,
  mapPin: (props) => <MapPin {...props} />,
  folderOpen: (props) => <FolderOpen {...props} />,
  square: (props) => <Square {...props} />,
  x: (props) => <X {...props} />,
  
  // Nouvelles icônes pour les outils
  folderUp: (props) => <FolderUp {...props} />,
  trash2: (props) => <Trash2 {...props} />,
  printerCheck: (props) => <Printer {...props} />,
  fingerprint: (props) => <Fingerprint {...props} />,
  squaresIntersect: (props) => <SquaresIntersect {...props} />,
};

// Configuration par défaut pour mobile/tablette
const defaultProps = {
  size: 20,
  strokeWidth: 2,
  color: 'currentColor'
};

export const IconWrapper = ({ icon: Icon, isActive = false, ...props }) => (
  <Icon {...defaultProps} {...props} />
);

export default Icons;