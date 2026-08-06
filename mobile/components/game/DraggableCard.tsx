import { memo, ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const CARD_SLOT_WIDTH = 62;

interface DraggableCardProps {
  children: ReactNode;
  enabled?: boolean;
  selected?: boolean;
  slotWidth?: number;
  onTap?: () => void;
  onDiscardDrag?: (absoluteY: number) => void;
  onReorder?: (translationX: number) => void;
  style?: ViewStyle;
}

export const DraggableCard = memo(function DraggableCard({
  children,
  enabled = true,
  selected = false,
  slotWidth = CARD_SLOT_WIDTH,
  onTap,
  onDiscardDrag,
  onReorder,
  style,
}: DraggableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .minDistance(8)
    .onBegin(() => {
      zIndex.value = 100;
      scale.value = 1.06;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);

      if (absY > 50 && absY > absX && onDiscardDrag) {
        runOnJS(onDiscardDrag)(e.absoluteY);
      } else if (absX > 24 && onReorder) {
        runOnJS(onReorder)(e.translationX);
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 1;
    });

  const tap = Gesture.Tap()
    .enabled(enabled)
    .maxDuration(250)
    .onEnd(() => {
      if (onTap) runOnJS(onTap)();
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.wrap,
          { width: slotWidth },
          selected && styles.selected,
          animStyle,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
});

export { CARD_SLOT_WIDTH };

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  selected: {
    marginBottom: 14,
  },
});
