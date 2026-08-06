import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  CAMPAIGN_LEVEL_INDEX,
  getChapterLabel,
  TOTAL_CAMPAIGN_LEVELS,
} from '../../constants/campaign/level-index';
import {
  loadCampaignProgress,
  CampaignProgress,
  isLevelUnlocked,
  getLevelStars,
} from '../../services/campaign-storage';
import { getCosmeticById } from '../../constants/cosmetics/catalog';

const MILESTONE_LEVELS = [10, 20, 30, 40, 50];

export default function CampaignMapScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [checkingIntro, setCheckingIntro] = useState(true);

  const refresh = useCallback(async () => {
    const loaded = await loadCampaignProgress();
    if (!loaded.introTutorialCompleted) {
      router.replace('/campaign/intro');
      return;
    }
    setProgress(loaded);
    setCheckingIntro(false);
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (checkingIntro) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  const completedCount = progress
    ? Object.values(progress.levelResults).filter((r) => r.completed).length
    : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campaign</Text>
      <Text style={styles.subtitle}>
        Learn Canasta in 15 tutorial levels, then master 35 challenge scenarios.
      </Text>

      <View style={styles.statsRow}>
        <Stat label="Completed" value={`${completedCount}/${TOTAL_CAMPAIGN_LEVELS}`} />
        <Stat
          label="Unlocked"
          value={`${progress?.highestUnlockedLevel ?? 1}/${TOTAL_CAMPAIGN_LEVELS}`}
        />
      </View>

      <View style={styles.milestones}>
        <Text style={styles.milestoneTitle}>Cosmetic rewards every 10 levels</Text>
        {MILESTONE_LEVELS.map((lvl) => {
          const level = CAMPAIGN_LEVEL_INDEX.find((l) => l.id === lvl);
          const cosmetic = level?.rewardCosmeticId
            ? getCosmeticById(level.rewardCosmeticId)
            : null;
          const done = progress ? getLevelStars(progress, lvl) > 0 || lvl < (progress.highestUnlockedLevel ?? 1) : false;
          return (
            <Text key={lvl} style={styles.milestoneItem}>
              {done ? '✓' : '○'} Lvl {lvl}: {cosmetic?.name ?? 'Reward'}
            </Text>
          );
        })}
      </View>

      <FlatList
        data={CAMPAIGN_LEVEL_INDEX}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item }) => {
          const unlocked = progress ? isLevelUnlocked(progress, item.id) : item.id === 1;
          const stars = progress ? getLevelStars(progress, item.id) : 0;
          const isTutorial = item.chapter === 'tutorial';

          return (
            <Pressable
              style={[styles.levelRow, !unlocked && styles.levelLocked]}
              disabled={!unlocked}
              onPress={() => router.push(`/campaign/${item.id}`)}
            >
              <View style={styles.levelBadge}>
                <Text style={styles.levelNum}>{item.id}</Text>
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelChapter}>
                  {getChapterLabel(item.chapter)}
                  {isTutorial && item.id === 1 ? ' · Start here' : ''}
                </Text>
                <Text style={styles.levelTitle}>{item.title}</Text>
                <Text style={styles.levelDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              <View style={styles.levelMeta}>
                {stars > 0 ? (
                  <Text style={styles.stars}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
                ) : unlocked ? (
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                ) : (
                  <Ionicons name="lock-closed" size={18} color="#475569" />
                )}
              </View>
            </Pressable>
          );
        }}
      />

      <Link href="/" asChild>
        <Pressable style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back to Home</Text>
        </Pressable>
      </Link>
    </View>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 12,
  },
  stat: { alignItems: 'center' },
  statValue: { color: '#fbbf24', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 11 },
  milestones: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  milestoneTitle: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  milestoneItem: { color: '#cbd5e1', fontSize: 11, lineHeight: 18 },
  list: { paddingBottom: 16, gap: 8 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  levelLocked: { opacity: 0.45 },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: { color: '#fbbf24', fontWeight: '800', fontSize: 14 },
  levelInfo: { flex: 1 },
  levelChapter: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  levelTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 15, marginTop: 2 },
  levelDesc: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  levelMeta: { alignItems: 'flex-end', minWidth: 48 },
  stars: { color: '#fbbf24', fontSize: 14 },
  backBtn: {
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  backBtnText: { color: '#94a3b8', fontSize: 14 },
});
