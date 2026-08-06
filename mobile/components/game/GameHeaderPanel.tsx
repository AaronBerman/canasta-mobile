import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GameRequirementInfo, MatchState } from '../../engine/index';
import { GameStatusBar } from './GameStatusBar';
import { GameRequirementsBar, hasRequirementContent } from './GameRequirementsBar';
import { TurnPhaseStrip } from './TurnPhaseStrip';
import { OtherPlayerSeat } from './OtherPlayersDropdown';

interface GameHeaderPanelProps {
  state: MatchState;
  humanTeam: number;
  otherPlayers: OtherPlayerSeat[];
  requirementInfo?: GameRequirementInfo | null;
  showTurnPhase?: boolean;
  isMyTurn: boolean;
  aiThinking?: boolean;
  headerExtra?: ReactNode;
  compact?: boolean;
}

function SectionDivider() {
  return <View style={styles.divider} />;
}

export function GameHeaderPanel({
  state,
  humanTeam,
  otherPlayers,
  requirementInfo,
  showTurnPhase = true,
  isMyTurn,
  aiThinking = false,
  headerExtra,
  compact = false,
}: GameHeaderPanelProps) {
  const showRequirements = !!requirementInfo && hasRequirementContent(requirementInfo);
  const showPhase =
    showTurnPhase && isMyTurn && state.phase === 'playing';

  return (
    <View style={[styles.panel, compact && styles.panelCompact]}>
      <GameStatusBar
        state={state}
        humanTeam={humanTeam}
        otherPlayers={otherPlayers}
        aiThinking={aiThinking}
        embedded
      />

      {headerExtra != null && (
        <>
          <SectionDivider />
          {headerExtra}
        </>
      )}

      {showRequirements && (
        <>
          <SectionDivider />
          <GameRequirementsBar info={requirementInfo!} embedded />
        </>
      )}

      {showPhase && (
        <>
          <SectionDivider />
          <TurnPhaseStrip
            turnPhase={state.turnPhase}
            hasDrawnThisTurn={state.hasDrawnThisTurn}
            isMyTurn={isMyTurn}
            embedded
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.6)',
  },
  panelCompact: {
    paddingVertical: 6,
    marginBottom: 6,
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(71,85,105,0.55)',
  },
});
