import { StyleSheet, Text, View } from 'react-native';

interface CampaignObjectiveBarProps {
  levelTitle: string;
  chapter: 'tutorial' | 'challenge';
  objectiveLabel: string;
  hint: string;
  levelComplete?: boolean;
  /** Render inside the shared game header panel. */
  embedded?: boolean;
}

export function CampaignObjectiveBar({
  levelTitle,
  chapter,
  objectiveLabel,
  hint,
  levelComplete = false,
  embedded = false,
}: CampaignObjectiveBarProps) {
  return (
    <View style={[embedded ? styles.embedded : styles.bar, levelComplete && styles.barComplete]}>
      <Text style={styles.chapter}>
        {chapter === 'tutorial' ? 'Tutorial' : 'Challenge'} · {levelTitle}
      </Text>
      <Text style={styles.objective}>
        {levelComplete ? 'Objective complete!' : `Goal: ${objectiveLabel}`}
      </Text>
      {!levelComplete && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#1e3a5f',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  barComplete: {
    backgroundColor: '#14532d',
    borderColor: '#22c55e',
  },
  embedded: {
    gap: 4,
  },
  chapter: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  objective: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  hint: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
});
