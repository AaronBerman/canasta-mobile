import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCosmetics } from '../stores/cosmetics-store';
import { CosmeticPreviewPanel } from '../components/cosmetics/CosmeticPreviewPanel';
import { MULTIPLAYER_ENABLED } from '../constants/features';

export default function HomeScreen() {
  const { progress } = useCosmetics();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Canasta Table</Text>
      <Text style={styles.subtitle}>Classic rules. Your way.</Text>

      <CosmeticPreviewPanel />

      <View style={styles.stats}>
        <Stat label="SP Wins" value={String(progress.singlePlayerWins)} />
        <Stat label="SP Points" value={String(progress.singlePlayerPoints)} />
      </View>

      <Link href="/game?mode=quick" asChild>
        <Pressable style={styles.primaryButton}>
          <Ionicons name="flash" size={22} color="#0f172a" />
          <View style={styles.buttonTextBlock}>
            <Text style={styles.primaryButtonText}>Quick Game</Text>
            <Text style={styles.buttonHint}>Relaxed rules · 3,500 pts</Text>
          </View>
        </Pressable>
      </Link>

      <Link href="/game" asChild>
        <Pressable style={styles.secondaryButton}>
          <Ionicons name="play" size={20} color="#f8fafc" />
          <View style={styles.buttonTextBlock}>
            <Text style={styles.secondaryButtonText}>Full Match</Text>
            <Text style={styles.buttonHintMuted}>Your house rules from Settings</Text>
          </View>
        </Pressable>
      </Link>

      <Link href="/campaign" asChild>
        <Pressable style={styles.campaignButton}>
          <Ionicons name="school" size={22} color="#f8fafc" />
          <Text style={styles.campaignButtonText}>Campaign (50 Levels)</Text>
        </Pressable>
      </Link>

      <Link href="/settings" asChild>
        <Pressable style={styles.secondaryButton}>
          <Ionicons name="settings" size={20} color="#f8fafc" />
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </Pressable>
      </Link>

      {MULTIPLAYER_ENABLED && (
        <Link href="/multiplayer" asChild>
          <Pressable style={styles.multiplayerButton}>
            <Ionicons name="people" size={22} color="#f8fafc" />
            <View style={styles.buttonTextBlock}>
              <Text style={styles.multiplayerButtonText}>Multiplayer</Text>
              <Text style={styles.buttonHintMuted}>Room codes · play with friends</Text>
            </View>
          </Pressable>
        </Link>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fbbf24',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  buttonTextBlock: {
    alignItems: 'flex-start',
  },
  buttonHint: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  buttonHintMuted: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  primaryButtonText: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  campaignButton: {
    backgroundColor: '#4338ca',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  campaignButtonText: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
  },
  multiplayerButton: {
    backgroundColor: '#0d9488',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  multiplayerButtonText: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#64748b',
    fontSize: 15,
  },
});
