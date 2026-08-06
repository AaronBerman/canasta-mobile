import { useRef, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useLayoutOrientation } from './useLayoutOrientation';

export function useDiscardZone() {
  const discardZoneRef = useRef<View>(null);
  /** Window Y of discard pile center — ref avoids re-render loops from measureInWindow. */
  const discardZoneYRef = useRef(0);
  const { layoutKey } = useLayoutOrientation();

  const measureDiscardZone = useCallback(() => {
    discardZoneRef.current?.measureInWindow((_x, y, _w, h) => {
      discardZoneYRef.current = y + h / 2;
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(measureDiscardZone, 80);
    return () => clearTimeout(timer);
  }, [layoutKey, measureDiscardZone]);

  return { discardZoneRef, discardZoneYRef, measureDiscardZone };
}
