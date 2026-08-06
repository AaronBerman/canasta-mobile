import { StyleSheet, Text, View } from 'react-native';
import { MatchState } from '../../engine/index';
import { OtherPlayerSeat } from './OtherPlayersDropdown';

interface GameStatusBarProps {
  state: MatchState;
  humanTeam: number;
  otherPlayers: OtherPlayerSeat[];
  aiThinking?: boolean;
  /** Render inside a shared header panel (no outer box). */
  embedded?: boolean;
}

export function GameStatusBar({
  state,
  humanTeam,
  otherPlayers,
  aiThinking = false,
  embedded = false,
}: GameStatusBarProps) {
  const us = state.teams[humanTeam].score;
  const them = state.teams[1 - humanTeam].score;
  const activeId = otherPlayers.find((p) => p.isActive)?.id;
  const activeName =
    activeId != null ? (state.players[activeId]?.name ?? 'Turn') : null;

  return (
    <View style={embedded ? styles.embedded : styles.bar}>
      <View style={styles.scoreBlock}>
        <Text style={styles.scoreUs}>Us {us}</Text>
        <Text style={styles.scoreSep}>·</Text>
        <Text style={styles.scoreThem}>Them {them}</Text>
        <Text style={styles.target}> → {state.rules.targetScore}</Text>
      </View>
      <View style={styles.chips}>
        {otherPlayers.map((p) => (
          <View
            key={p.id}
            style={[styles.chip, p.isActive ? styles.chipActive : null]}
          >
            <Text style={[styles.chipRole, p.role === 'P' ? styles.chipPartner : null]}>
              {p.role}
            </Text>
            <Text style={styles.chipCount}>{p.cardCount}</Text>
          </View>
        ))}
      </View>
      {activeName != null ? (
        <View style={styles.turnBadge}>
          <Text style={[styles.turnBadgeText, aiThinking && styles.turnBadgeThinking]}>
            {aiThinking ? `${activeName} is thinking…` : activeName}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.6)',
  },
  embedded: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 0,
  },
  scoreUs: {
    color: '#86efac',
    fontSize: 14,
    fontWeight: '800',
  },
  scoreSep: {
    color: '#475569',
    marginHorizontal: 4,
    fontSize: 12,
  },
  scoreThem: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '800',
  },
  target: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251,191,36,0.12)',
  },
  chipRole: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
  },
  chipPartner: {
    color: '#86efac',
  },
  chipCount: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
  },
  turnBadge: {
    width: '100%',
    paddingTop: 2,
  },
  turnBadgeText: {
    color: '#fde047',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  turnBadgeThinking: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});
