import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LevelCompletionResult } from '../../constants/campaign/types';

interface CampaignResultModalProps {
  visible: boolean;
  levelTitle: string;
  completion: LevelCompletionResult | null;
  unlockMessages: string[];
  hasNextLevel: boolean;
  successTitle?: string;
  primaryButtonLabel?: string;
  mapButtonLabel?: string;
  hideStars?: boolean;
  onRetry: () => void;
  onNextLevel: () => void;
  onMap: () => void;
}

function StarRow({ count }: { count: number }) {
  return (
    <Text style={styles.stars}>
      {[1, 2, 3].map((i) => (
        <Text key={i} style={i <= count ? styles.starOn : styles.starOff}>
          ★
        </Text>
      ))}
    </Text>
  );
}

export function CampaignResultModal({
  visible,
  levelTitle,
  completion,
  unlockMessages,
  hasNextLevel,
  successTitle = 'Level Complete!',
  primaryButtonLabel,
  mapButtonLabel = 'Level Map',
  hideStars = false,
  onRetry,
  onNextLevel,
  onMap,
}: CampaignResultModalProps) {
  if (!visible) return null;

  const stars = completion?.stars ?? 1;
  const unlockedNext = completion?.unlockedNextLevel ?? true;
  const showPrimary = (hasNextLevel && unlockedNext) || Boolean(primaryButtonLabel);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{successTitle}</Text>
          <Text style={styles.subtitle}>{levelTitle}</Text>
          {!hideStars && <StarRow count={stars} />}
          {unlockMessages.length > 0 && (
            <View style={styles.unlocks}>
              <Text style={styles.unlockTitle}>Rewards unlocked</Text>
              {unlockMessages.map((m) => (
                <Text key={m} style={styles.unlockItem}>
                  {m}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            {showPrimary && (
              <Pressable style={styles.primaryBtn} onPress={onNextLevel}>
                <Text style={styles.primaryBtnText}>
                  {primaryButtonLabel ?? 'Next Level'}
                </Text>
              </Pressable>
            )}
            <Pressable style={styles.secondaryBtn} onPress={onMap}>
              <Text style={styles.secondaryBtnText}>{mapButtonLabel}</Text>
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={onRetry}>
              <Text style={styles.linkBtnText}>Replay</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    color: '#86efac',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  stars: {
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 16,
  },
  starOn: { color: '#fbbf24' },
  starOff: { color: '#475569' },
  unlocks: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  unlockTitle: { color: '#86efac', fontWeight: '700', marginBottom: 4 },
  unlockItem: { color: '#e2e8f0', fontSize: 12 },
  actions: { gap: 10 },
  primaryBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0f172a', fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  secondaryBtnText: { color: '#f8fafc', fontWeight: '700', fontSize: 15 },
  linkBtn: { padding: 8, alignItems: 'center' },
  linkBtnText: { color: '#94a3b8', fontSize: 14 },
});
