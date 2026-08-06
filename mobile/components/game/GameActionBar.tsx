import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TurnPhase, GamePhase } from '../../engine/index';

import type { ActionHints } from '../../utils/action-hints';



interface GameActionBarProps {

  turnPhase: TurnPhase;

  phase?: GamePhase;

  isMyTurn: boolean;

  canMeldNow?: boolean;

  canTakeDiscard: boolean;

  stockEmptyAtTurnStart?: boolean;

  selectedCount: number;

  meldActionLabel: string;

  canMeldSelection: boolean;

  requiresMeldTarget?: boolean;

  mustMeldDiscardTop?: boolean;

  canSkipMeld?: boolean;

  wouldEmptyHand?: boolean;

  autoIncludedWild?: boolean;

  readyToGoOut?: boolean;

  goOutBlockers?: string[];

  actionHints?: ActionHints;

  onDrawStock: () => void;

  onTakeDiscard: () => void;

  onMeld: () => void;

  onSkipMeld: () => void;

  onDiscardSelected: () => void;

  onShowHint?: (message: string) => void;

  canUndo?: boolean;

  turnStuck?: boolean;

  onUndo?: () => void;

}



export function GameActionBar({

  turnPhase,

  phase = 'playing',

  isMyTurn,

  canMeldNow = false,

  canTakeDiscard,

  stockEmptyAtTurnStart = false,

  selectedCount,

  meldActionLabel,

  canMeldSelection,

  requiresMeldTarget = false,

  mustMeldDiscardTop = false,

  canSkipMeld = true,

  wouldEmptyHand = false,

  autoIncludedWild = false,

  readyToGoOut = false,

  goOutBlockers = [],

  actionHints = {},

  onDrawStock,

  onTakeDiscard,

  onMeld,

  onSkipMeld,

  onDiscardSelected,

  onShowHint,

  canUndo = false,

  turnStuck = false,

  onUndo,

}: GameActionBarProps) {

  if (phase === 'handOver' || phase === 'gameOver') {
    return (
      <View style={styles.bar}>
        <Text style={styles.handComplete}>Hand complete</Text>
      </View>
    );
  }

  if (!isMyTurn) {

    return (

      <View style={styles.bar}>

        <Text style={styles.waiting}>Waiting for other players…</Text>

      </View>

    );

  }



  const meldLabel = requiresMeldTarget

    ? 'Tap a pile for wild card(s)'

    : canMeldSelection && meldActionLabel

      ? `Meld: ${meldActionLabel}`

      : selectedCount > 0

        ? `Meld Selected (${selectedCount})`

        : 'Meld Selected';



  const preDrawMeld = turnPhase === 'draw' && canMeldNow;

  const postDrawMeld = turnPhase === 'meld';



  const primaryHint =

    (turnPhase === 'draw' && !canTakeDiscard && actionHints.takeDiscard) ||

    (turnPhase === 'meld' && !canSkipMeld && actionHints.skipMeld) ||

    (turnPhase === 'meld' && !canMeldSelection && selectedCount > 0 && actionHints.meld) ||

    (turnPhase === 'discard' && selectedCount !== 1 && actionHints.discard) ||

    (turnPhase === 'discard' && goOutBlockers.length > 0 && actionHints.discard) ||

    undefined;



  const phaseHints: string[] = [];
  if (stockEmptyAtTurnStart) phaseHints.push('Stock empty — hand ending…');
  if (turnPhase === 'draw' && preDrawMeld) {
    if (wouldEmptyHand) phaseHints.push('Keep 1 card to go out');
    if (autoIncludedWild) phaseHints.push('Wild included for mixed meld');
  }
  if (postDrawMeld) {
    if (mustMeldDiscardTop) phaseHints.push('Must meld discard top in this meld');
    if (wouldEmptyHand) phaseHints.push('Keep 1 card to go out');
    if (autoIncludedWild) phaseHints.push('Wild included for mixed meld');
  }
  if (turnPhase === 'discard') {
    if (readyToGoOut) phaseHints.push('Discard last card to go out');
    else if (goOutBlockers.length > 0) phaseHints.push(goOutBlockers[0]);
  }
  if (turnStuck && canUndo) {
    phaseHints.push('No legal play — tap Undo to take back melds');
  }

  const showUndo =
    canUndo &&
    onUndo &&
    (turnPhase === 'meld' || turnPhase === 'discard' || turnPhase === 'draw');

  return (
    <View style={styles.wrapper}>
      {(phaseHints.length > 0 || primaryHint) && (
        <View style={styles.hintRow}>
          {phaseHints.map((hint) => (
            <Text key={hint} style={styles.phaseHint}>
              {hint}
            </Text>
          ))}
          {primaryHint && (
            <Text style={styles.hintText}>💡 {primaryHint}</Text>
          )}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bar}
        keyboardShouldPersistTaps="handled"
      >
        {showUndo && (
          <ActionButton
            label="Undo"
            onPress={onUndo!}
            primary={turnStuck}
          />
        )}

        {turnPhase === 'draw' && !stockEmptyAtTurnStart && (
          <>
            {preDrawMeld && (
              <HintableButton
                label={meldLabel}
                onPress={onMeld}
                disabled={!canMeldSelection}
                hint={actionHints.meld}
                onShowHint={onShowHint}
              />
            )}
            <ActionButton label="Draw Stock" onPress={onDrawStock} primary />
            <HintableButton
              label="Take Discard"
              onPress={onTakeDiscard}
              disabled={!canTakeDiscard}
              hint={actionHints.takeDiscard}
              onShowHint={onShowHint}
            />
          </>
        )}

        {postDrawMeld && (
          <>
            <HintableButton
              label={meldLabel}
              onPress={onMeld}
              primary
              disabled={!canMeldSelection}
              hint={actionHints.meld}
              onShowHint={onShowHint}
            />
            <HintableButton
              label="Skip Meld"
              onPress={onSkipMeld}
              disabled={!canSkipMeld}
              hint={actionHints.skipMeld}
              onShowHint={onShowHint}
            />
          </>
        )}

        {turnPhase === 'discard' && (
          <HintableButton
            label={readyToGoOut ? 'Go Out' : 'Discard'}
            onPress={onDiscardSelected}
            primary
            disabled={selectedCount !== 1}
            hint={actionHints.discard}
            onShowHint={onShowHint}
          />
        )}
      </ScrollView>
    </View>
  );
}



function HintableButton({

  label,

  onPress,

  primary,

  disabled,

  hint,

  onShowHint,

}: {

  label: string;

  onPress: () => void;

  primary?: boolean;

  disabled?: boolean;

  hint?: string;

  onShowHint?: (message: string) => void;

}) {

  const handlePress = () => {

    if (disabled && hint && onShowHint) {

      onShowHint(hint);

      return;

    }

    onPress();

  };



  return (

    <ActionButton

      label={label}

      onPress={handlePress}

      primary={primary}

      disabled={disabled && !hint}

      dimmed={disabled}

    />

  );

}



function ActionButton({

  label,

  onPress,

  primary,

  disabled,

  dimmed,

}: {

  label: string;

  onPress: () => void;

  primary?: boolean;

  disabled?: boolean;

  dimmed?: boolean;

}) {

  return (

    <Pressable

      style={[

        styles.btn,

        primary && styles.btnPrimary,

        (disabled || dimmed) && styles.btnDisabled,

      ]}

      onPress={onPress}

      disabled={disabled}

    >

      <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>

    </Pressable>

  );

}



const styles = StyleSheet.create({

  wrapper: {

    backgroundColor: '#1e293b',

  },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 2,
  },
  phaseHint: {
    color: '#fde047',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },

  hintText: {

    color: '#94a3b8',

    fontSize: 11,

    lineHeight: 15,

    fontWeight: '500',

  },

  waiting: {

    color: '#94a3b8',

    fontSize: 13,

    textAlign: 'center',

    flex: 1,

  },

  handComplete: {

    color: '#86efac',

    fontSize: 13,

    textAlign: 'center',

    flex: 1,

    fontWeight: '600',

  },

  stockEmpty: {

    color: '#fde047',

    fontSize: 12,

    textAlign: 'center',

    flex: 1,

    fontWeight: '600',

  },

  mustMeldHint: {

    color: '#fde047',

    fontSize: 12,

    textAlign: 'center',

    flex: 1,

    fontWeight: '600',

  },

  goOutHint: {

    color: '#86efac',

    fontSize: 12,

    textAlign: 'center',

    flex: 1,

    fontWeight: '700',

  },

  goOutBlocked: {

    color: '#f87171',

    fontSize: 12,

    textAlign: 'center',

    flex: 1,

    fontWeight: '600',

  },

  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    flexShrink: 0,
  },

  btnPrimary: {

    backgroundColor: '#fbbf24',

    borderColor: '#f59e0b',

  },

  btnDisabled: {

    opacity: 0.45,

  },

  btnText: {

    color: '#f8fafc',

    fontWeight: '600',

    fontSize: 13,

  },

  btnTextPrimary: {

    color: '#0f172a',

  },

});


