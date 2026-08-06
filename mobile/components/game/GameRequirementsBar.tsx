import { StyleSheet, Text, View } from 'react-native';
import { GameRequirementInfo, describeRequirementLines } from '../../engine/index';

interface GameRequirementsBarProps {
  info: GameRequirementInfo;
  /** Render inside a shared header panel (no outer box). */
  embedded?: boolean;
}

export function hasRequirementContent(info: GameRequirementInfo): boolean {
  const lines = describeRequirementLines(info);
  const showProgress = info.initialMeldPoints != null && info.initialMeldPoints > 0;
  return lines.length > 0 || showProgress;
}

export function GameRequirementsBar({ info, embedded = false }: GameRequirementsBarProps) {
  const lines = describeRequirementLines(info);
  const showProgress = info.initialMeldPoints != null && info.initialMeldPoints > 0;
  const staged = info.stagedMeldPoints ?? 0;
  const required = info.initialMeldPoints ?? 0;
  const progress = required > 0 ? Math.min(1, staged / required) : 0;
  const metOpening = staged >= required && required > 0;

  if (!hasRequirementContent(info)) return null;

  return (
    <View style={embedded ? styles.embedded : styles.container}>
      {showProgress && (
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Opening meld</Text>
            <Text style={[styles.progressValue, metOpening && styles.progressValueMet]}>
              {staged}/{required} pts
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(progress * 100, staged > 0 ? 4 : 0)}%` },
                metOpening && styles.progressFillMet,
              ]}
            />
          </View>
        </View>
      )}
      {lines.map((line) => (
        <Text
          key={line}
          style={[
            styles.line,
            line.includes('go out') && styles.highlight,
            line.startsWith('Cannot go out') && styles.warn,
            line.includes('✓') && styles.ok,
          ]}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  embedded: {
    gap: 6,
  },
  progressBlock: {
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValue: {
    color: '#fde047',
    fontSize: 12,
    fontWeight: '800',
  },
  progressValueMet: {
    color: '#86efac',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  progressFillMet: {
    backgroundColor: '#22c55e',
  },
  line: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  highlight: {
    color: '#fde047',
  },
  warn: {
    color: '#f87171',
  },
  ok: {
    color: '#86efac',
  },
});
