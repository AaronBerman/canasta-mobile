import { memo, ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  GameRequirementInfo,
  MatchState,
  Rank,
  getDiscardPileStatus,
  describeDiscardPileStatus,
} from '../../engine/index';
import {
  CardBackCosmetic,
  FontStyleCosmetic,
  TableSkinCosmetic,
} from '../../constants/cosmetics/types';
import { GameTable } from '../table/GameTable';
import { GameHeaderPanel } from './GameHeaderPanel';
import { TableCenterPiles } from './TableCenterPiles';
import { TeamMeldsPanel } from './TeamMeldsPanel';
import { OtherPlayerSeat } from './OtherPlayersDropdown';

export interface MeldPanelProps {
  highlightRanks?: Rank[];
  additionCounts?: Partial<Record<Rank, number>>;
  targetMeldRank?: Rank | null;
  selectableTargetRanks?: Rank[];
  meldSelectionEnabled?: boolean;
  onSelectTargetMeld?: (rank: Rank) => void;
}

interface GameBoardProps {
  state: MatchState;
  humanTeam: number;
  otherPlayers: OtherPlayerSeat[];
  tableSkin: TableSkinCosmetic;
  cardBack: CardBackCosmetic;
  fontStyle: FontStyleCosmetic;
  discardZoneRef: RefObject<View | null>;
  requirementInfo?: GameRequirementInfo | null;
  showTurnPhase?: boolean;
  isMyTurn: boolean;
  aiThinking?: boolean;
  meldUiActive: boolean;
  meldPanel: MeldPanelProps;
  headerExtra?: ReactNode;
  message?: string;
  /** Tighter table layout when the device is in landscape. */
  compact?: boolean;
}

export const GameBoard = memo(function GameBoard({
  state,
  humanTeam,
  otherPlayers,
  tableSkin,
  cardBack,
  fontStyle,
  discardZoneRef,
  requirementInfo,
  showTurnPhase = true,
  isMyTurn,
  aiThinking = false,
  meldUiActive,
  meldPanel,
  headerExtra,
  message,
  compact = false,
}: GameBoardProps) {
  const opponentTeam = 1 - humanTeam;
  const discardStatus = getDiscardPileStatus(state.discard, state.rules);
  const discardStatusHint = describeDiscardPileStatus(state.discard, state.rules);
  const displayMessage = message ?? state.message;

  const humanMeldProps = meldUiActive
    ? {
        highlightRanks: meldPanel.highlightRanks ?? [],
        additionCounts: meldPanel.additionCounts ?? {},
        targetMeldRank: meldPanel.targetMeldRank ?? null,
        selectableTargetRanks: meldPanel.selectableTargetRanks ?? [],
        meldSelectionEnabled: meldPanel.meldSelectionEnabled ?? false,
        onSelectTargetMeld: meldPanel.onSelectTargetMeld,
      }
    : {};

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <GameHeaderPanel
        state={state}
        humanTeam={humanTeam}
        otherPlayers={otherPlayers}
        requirementInfo={requirementInfo}
        showTurnPhase={showTurnPhase}
        isMyTurn={isMyTurn}
        aiThinking={aiThinking}
        headerExtra={headerExtra}
        compact={compact}
      />

      {displayMessage ? (
        <Text style={styles.message} numberOfLines={2}>
          {displayMessage}
        </Text>
      ) : null}

      <GameTable skin={tableSkin}>
        <View style={[styles.tableLayout, compact && styles.tableLayoutCompact]}>
          <View style={styles.zone}>
            <TeamMeldsPanel
              layout="compact"
              melds={state.teams[opponentTeam].melds}
              redThrees={state.teams[opponentTeam].redThrees}
              teamHasMelded={state.teams[opponentTeam].hasMelded}
              rules={state.rules}
              teamLabel="Opponents"
              fontStyle={fontStyle}
              showEmpty
            />
          </View>

          <TableCenterPiles
            stockCount={state.stock.length}
            discard={state.discard}
            discardStatus={discardStatus}
            discardStatusHint={discardStatusHint}
            cardBack={cardBack}
            fontStyle={fontStyle}
            discardZoneRef={discardZoneRef}
          />

          <View style={styles.zone}>
            <TeamMeldsPanel
              layout="compact"
              melds={state.teams[humanTeam].melds}
              redThrees={state.teams[humanTeam].redThrees}
              teamHasMelded={state.teams[humanTeam].hasMelded}
              rules={state.rules}
              teamLabel="Your Team"
              fontStyle={fontStyle}
              isHumanTeam
              showEmpty
              {...humanMeldProps}
            />
          </View>
        </View>
      </GameTable>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 12,
  },
  contentCompact: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  message: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  tableLayout: {
    minHeight: 240,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableLayoutCompact: {
    minHeight: 180,
    paddingVertical: 2,
  },
  zone: {
    minHeight: 56,
  },
});
