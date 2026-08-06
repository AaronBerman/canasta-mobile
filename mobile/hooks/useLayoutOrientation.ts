import { useWindowDimensions } from 'react-native';

export function useLayoutOrientation() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  return {
    width,
    height,
    isLandscape,
    isPortrait,
    /** Stable key for effects that should rerun on rotation. */
    layoutKey: `${width}x${height}`,
  };
}
