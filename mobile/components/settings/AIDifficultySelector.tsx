import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AI_DIFFICULTY_OPTIONS,
  AIDifficultySettings,
  difficultyLabel,
} from '../../services/ai-difficulty-storage';
import { AIDifficulty } from '../../engine/index';

interface AIDifficultySelectorProps {
  value: AIDifficultySettings;
  onChange: (next: AIDifficultySettings) => void;
}

export function AIDifficultySelector({ value, onChange }: AIDifficultySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.subheading}>Saved for your next single-player game</Text>

      <DifficultyRow
        label="Partner"
        hint="Your teammate across the table"
        selected={value.partner}
        onSelect={(partner) => onChange({ ...value, partner })}
      />

      <DifficultyRow
        label="Opponents"
        hint="Both players on the other team"
        selected={value.opponent}
        onSelect={(opponent) => onChange({ ...value, opponent })}
      />
    </View>
  );
}

function DifficultyRow({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  selected: AIDifficulty;
  onSelect: (level: AIDifficulty) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      <View style={styles.segmented}>
        {AI_DIFFICULTY_OPTIONS.map((level) => {
          const active = level === selected;
          return (
            <Pressable
              key={level}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => onSelect(level)}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {difficultyLabel(level)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  subheading: {
    color: '#64748b',
    fontSize: 11,
    marginTop: -4,
  },
  row: {
    gap: 8,
  },
  rowHeader: {
    gap: 2,
  },
  rowLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  rowHint: {
    color: '#64748b',
    fontSize: 11,
  },
  segmented: {
    flexDirection: 'row',
    gap: 6,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#f59e0b',
  },
  optionText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#0f172a',
  },
});
