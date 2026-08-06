import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type ToastKind = 'error' | 'info';

interface ToastState {
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [opacity]);

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, kind });
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      timerRef.current = setTimeout(hide, TOAST_DURATION_MS);
    },
    [hide, opacity],
  );

  const showError = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast, showError }}>
      {children}
      {toast && (
        <Animated.View
          style={[styles.wrap, { opacity }]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.toast,
              toast.kind === 'error' ? styles.toastError : styles.toastInfo,
            ]}
          >
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 120,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 420,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  toastError: {
    backgroundColor: '#450a0a',
    borderColor: '#f87171',
  },
  toastInfo: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
  },
  text: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
