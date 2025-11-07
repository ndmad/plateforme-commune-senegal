import { useState, useEffect } from 'react';

const useTablet = () => {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Détection basée sur la largeur (taille tablette standard)
      const isTabletWidth = (width >= 768 && width <= 1024) || (width > 1024 && width <= 1366);
      
      // Détection user agent pour les vraies tablettes
      const isTabletUserAgent = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
      
      // Ratio d'aspect typique tablette
      const aspectRatio = width / height;
      const isTabletAspect = aspectRatio >= 0.7 && aspectRatio <= 1.4;
      
      // Combinaison des critères - plus permissive pour tablette
      setIsTablet(isTabletWidth || isTabletUserAgent);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);
    window.addEventListener('orientationchange', checkTablet);
    
    return () => {
      window.removeEventListener('resize', checkTablet);
      window.removeEventListener('orientationchange', checkTablet);
    };
  }, []);

  return isTablet;
};

export default useTablet;