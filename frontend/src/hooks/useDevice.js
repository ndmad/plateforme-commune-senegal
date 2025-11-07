import { useState, useEffect } from 'react';
import useMobile from './useMobile';
import useTablet from './useTablet';

const useDevice = () => {
  const isMobile = useMobile();
  const isTablet = useTablet();
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    if (isMobile) {
      setDeviceType('mobile');
    } else if (isTablet) {
      setDeviceType('tablet');
    } else {
      setDeviceType('desktop');
    }
  }, [isMobile, isTablet]);

  return deviceType;
};

export default useDevice;