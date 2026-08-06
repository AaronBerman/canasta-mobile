import { StyleSheet, Text, View } from 'react-native';
import { TurnPhase } from '../../engine/index';

interface TurnPhaseStripProps {
  turnPhase: TurnPhase;
  hasDrawnThisTurn: boolean;
  isMyTurn: boolean;
  /** Render inside a shared header panel (no outer box). */
  embedded?: boolean;
}

const STEPS = [
  { id: 1, label: 'Meld', sub: 'optional' },
  { id: 2, label: 'Draw / Pile', sub: null },
  { id: 3, label: 'Meld', sub: null },
  { id: 4, label: 'Discard', sub: null },
] as const;

export function TurnPhaseStrip({
  turnPhase,
  hasDrawnThisTurn,
  isMyTurn,
  embedded = false,
}: TurnPhaseStripProps) {
  const containerStyle = embedded ? styles.embedded : styles.container;

  if (!isMyTurn) {
    return (
      <View style={containerStyle}>
        <Text style={styles.waiting}>Opponents&apos; turn</Text>
      </View>
    );
  }

  let activeStep = 1;
  const completed = new Set<number>();

  if (turnPhase === 'discard') {
    activeStep = 4;
    completed.add(1);
    completed.add(2);
    completed.add(3);
  } else if (turnPhase === 'meld' && hasDrawnThisTurn) {
    activeStep = 3;
    completed.add(1);
    completed.add(2);
  } else if (turnPhase === 'draw' && !hasDrawnThisTurn) {
    activeStep = 1;
  }

  return (
    <View style={containerStyle}>
      <View style={styles.row}>
        {STEPS.map((step, index) => {
          const isActive = step.id === activeStep;
          const isDone = completed.has(step.id);
          const isUpcoming = !isActive && !isDone;

          return (
            <View key={step.id} style={styles.stepWrap}>
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    (isDone || isActive) && styles.connectorDone,
                  ]}
                />
              )}
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.dot,
                    isActive && styles.dotActive,
                    isDone && styles.dotDone,
                    isUpcoming && styles.dotUpcoming,
                  ]}
                >
                  <Text
                    style={[
                      styles.dotText,
                      (isActive || isDone) && styles.dotTextActive,
                    ]}
                  >
                    {isDone ? '✓' : step.id}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.label,
                    isActive && styles.labelActive,
                    isDone && styles.labelDone,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
                {step.sub && isActive && (
                  <Text style={styles.sub}>{step.sub}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  embedded: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  waiting: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  connector: {
    position: 'absolute',
    left: -8,
    top: 11,
    width: 16,
    height: 2,
    backgroundColor: '#334155',
  },
  connectorDone: {
    backgroundColor: '#fbbf24',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#f59e0b',
  },
  dotDone: {
    backgroundColor: '#166534',
    borderColor: '#22c55e',
  },
  dotUpcoming: {
    opacity: 0.55,
  },
  dotText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
  },
  dotTextActive: {
    color: '#0f172a',
  },
  label: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelActive: {
    color: '#fde047',
  },
  labelDone: {
    color: '#86efac',
  },
  sub: {
    color: '#94a3b8',
    fontSize: 8,
    fontStyle: 'italic',
  },
});
