import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { HandResult, MatchState } from '../../engine/index';

interface HandResultModalProps {
  visible: boolean;
  state: MatchState;
  unlockMessages: string[];
  onNextHand: () => void;
  onNewMatch: () => void;
  onDismissUnlocks: () => void;
}

export function HandResultModal({
  visible,
  state,
  unlockMessages,
  onNextHand,
  onNewMatch,
  onDismissUnlocks,
}: HandResultModalProps) {
  const result = state.lastHandResult;
  const isGameOver = state.phase === 'gameOver';

  if (!visible || !result) return null;

  const humanTeam = state.players[state.humanSeat].teamId;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {isGameOver ? 'Match Over!' : 'Hand Complete'}
          </Text>

          <Text style={styles.body}>
            {result.stockExhausted
              ? 'The stock ran out — scores tallied from table and cards left in hand.'
              : result.humanWon
                ? 'Your team went out this hand!'
                : `Team ${result.winningTeamId + 1} went out.`}
          </Text>

          <View style={styles.scores}>
            <ScoreRow
              label="Hand points (Team 1)"
              value={result.teamScores[0]}
              highlight={humanTeam === 0}
            />
            <ScoreRow
              label="Hand points (Team 2)"
              value={result.teamScores[1]}
              highlight={humanTeam === 1}
            />
            <ScoreRow label="Your team total" value={state.teams[humanTeam].score} highlight />
          </View>

          {unlockMessages.length > 0 && (
            <View style={styles.unlocks}>
              <Text style={styles.unlockTitle}>New unlocks!</Text>
              {unlockMessages.map((m) => (
                <Text key={m} style={styles.unlockItem}>{m}</Text>
              ))}
              <Pressable onPress={onDismissUnlocks}>
                <Text style={styles.dismiss}>Dismiss</Text>
              </Pressable>
            </View>
          )}

          {isGameOver ? (
            <>
              <Text style={styles.winner}>
                {state.winnerTeamId === humanTeam ? 'You win the match!' : 'Better luck next time!'}
              </Text>
              <Pressable style={styles.primaryBtn} onPress={onNewMatch}>
                <Text style={styles.primaryBtnText}>New Match</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.primaryBtn} onPress={onNextHand}>
              <Text style={styles.primaryBtnText}>Next Hand</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ScoreRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={[styles.scoreValue, highlight && styles.scoreHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    color: '#fbbf24',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: { color: '#e2e8f0', textAlign: 'center', marginBottom: 16 },
  scores: { gap: 8, marginBottom: 16 },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreLabel: { color: '#94a3b8', fontSize: 13 },
  scoreValue: { color: '#f8fafc', fontWeight: '700' },
  scoreHighlight: { color: '#fbbf24' },
  unlocks: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  unlockTitle: { color: '#86efac', fontWeight: '700', marginBottom: 4 },
  unlockItem: { color: '#e2e8f0', fontSize: 12 },
  dismiss: { color: '#64748b', marginTop: 8, fontSize: 12 },
  winner: {
    color: '#f8fafc',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0f172a', fontWeight: '800', fontSize: 16 },
});
