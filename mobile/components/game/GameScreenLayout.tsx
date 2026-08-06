import { ReactNode, useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CardBackCosmetic,
  FontStyleCosmetic,
  TableSkinCosmetic,
} from '../../constants/cosmetics/types';
import { Card } from '../../engine/index';
import { SinglePlayerGameHandle } from '../../hooks/game/types';
import { useLayoutOrientation } from '../../hooks/useLayoutOrientation';
import { MeldPanelProps } from './GameBoard';
import { OtherPlayerSeat } from './OtherPlayersDropdown';
import { useDiscardZone } from '../../hooks/useDiscardZone';
import { GameBoard } from './GameBoard';
import { PlayerHand } from './PlayerHand';
import { GameActionBar } from './GameActionBar';
import { getOtherPlayerSeats } from './other-players';

export interface GameScreenLayoutProps {
  game: SinglePlayerGameHandle;
  fontsReady: boolean;
  tableSkin: TableSkinCosmetic;
  cardBack: CardBackCosmetic;
  fontStyle: FontStyleCosmetic;
  meldPanel: MeldPanelProps;
  otherPlayers?: OtherPlayerSeat[];
  headerExtra?: ReactNode;
  showTurnPhase?: boolean;
  handEnabled?: boolean;
  showActionBar?: boolean;
  footer?: ReactNode;
  overlay?: ReactNode;
  loadingFallback?: ReactNode;
}

export function GameScreenLayout({
  game,
  fontsReady,
  tableSkin,
  cardBack,
  fontStyle,
  meldPanel,
  otherPlayers: otherPlayersOverride,
  headerExtra,
  showTurnPhase = true,
  handEnabled,
  showActionBar = true,
  footer,
  overlay,
  loadingFallback,
}: GameScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { isLandscape } = useLayoutOrientation();
  const { discardZoneRef, discardZoneYRef } = useDiscardZone();
  const enabled = handEnabled ?? game.isMyTurn;
  const onDiscardCardRef = useRef(game.onDiscardCard);
  const turnPhaseRef = useRef(game.state?.turnPhase);
  onDiscardCardRef.current = game.onDiscardCard;
  turnPhaseRef.current = game.state?.turnPhase;

  const handDockPadding = useMemo(
    () => ({
      portrait: { paddingBottom: Math.max(insets.bottom, 8) },
      landscapeLeft: { paddingLeft: Math.max(insets.left, 8) },
      landscapeRight: { paddingRight: Math.max(insets.right, 8) },
    }),
    [insets.bottom, insets.left, insets.right],
  );

  const handleDiscardDrag = useCallback((card: Card) => {
    if (turnPhaseRef.current === 'discard') onDiscardCardRef.current(card);
  }, []);

  const actionBarProps = useMemo(() => {
    if (!game.state) return null;
    return {
      phase: game.state.phase,
      turnPhase: game.state.turnPhase,
      isMyTurn: game.isMyTurn,
      canMeldNow: game.canMeldNow,
      canTakeDiscard: game.canTakeDiscard,
      stockEmptyAtTurnStart: game.stockEmptyAtTurnStart,
      selectedCount: game.selectedCardIds.size,
      meldActionLabel: game.meldActionLabel,
      canMeldSelection: game.canMeldSelection,
      requiresMeldTarget: game.requiresMeldTarget,
      mustMeldDiscardTop: game.mustMeldDiscardTop,
      canSkipMeld: game.canSkipMeld,
      wouldEmptyHand: game.wouldEmptyHand,
      autoIncludedWild: game.autoIncludedWild,
      readyToGoOut: game.requirementInfo?.readyToGoOut ?? false,
      goOutBlockers: game.requirementInfo?.goOutBlockers ?? [],
      actionHints: game.actionHints,
      onShowHint: game.showActionHint,
      onDrawStock: game.onDrawStock,
      onTakeDiscard: game.onTakeDiscard,
      onMeld: game.onMeldSelected,
      onSkipMeld: game.onSkipMeld,
      onDiscardSelected: game.onDiscardSelected,
      canUndo: game.canUndo,
      turnStuck: game.turnStuck,
      onUndo: game.onUndoTurn,
    };
  }, [game]);

  const otherPlayers = useMemo(() => {
    if (otherPlayersOverride) return otherPlayersOverride;
    if (!game.state) return [];
    return getOtherPlayerSeats(game.state);
  }, [otherPlayersOverride, game.state]);

  if (game.loading || !game.state || !fontsReady) {
    return (
      loadingFallback ?? (
        <View style={styles.loading}>
          <ActivityIndicator color="#fbbf24" size="large" />
        </View>
      )
    );
  }

  const state = game.state;
  const humanTeam = state.players[state.humanSeat].teamId;

  return (
    <View style={[styles.root, isLandscape && styles.rootLandscape]}>
      <View
        style={[
          styles.tableArea,
          isLandscape && styles.tableAreaLandscape,
          isLandscape && handDockPadding.landscapeLeft,
        ]}
      >
        <GameBoard
          state={state}
          humanTeam={humanTeam}
          otherPlayers={otherPlayers}
          tableSkin={tableSkin}
          cardBack={cardBack}
          fontStyle={fontStyle}
          discardZoneRef={discardZoneRef}
          requirementInfo={game.requirementInfo}
          showTurnPhase={showTurnPhase}
          isMyTurn={game.isMyTurn}
          aiThinking={game.aiThinking}
          meldUiActive={game.meldUiActive}
          meldPanel={meldPanel}
          headerExtra={headerExtra}
          compact={isLandscape}
        />
      </View>

      <View
        style={[
          styles.handDock,
          isLandscape ? styles.handDockLandscape : handDockPadding.portrait,
          isLandscape && handDockPadding.landscapeRight,
        ]}
      >
        <PlayerHand
          groups={game.handGroups}
          fontStyle={fontStyle}
          selectedIds={game.selectedCardIds}
          newCardIds={game.newCardIds}
          enabled={enabled}
          layout={isLandscape ? 'landscape' : 'portrait'}
          onToggleSelect={game.toggleCardSelection}
          onSelectGroup={game.selectMeldGroup}
          onDiscardDrag={handleDiscardDrag}
          onReorder={game.reorderHand}
          onAutoGroup={game.onAutoGroupHand}
          discardZoneYRef={discardZoneYRef}
        />
        {showActionBar && actionBarProps && <GameActionBar {...actionBarProps} />}
        {footer}
      </View>

      {overlay}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  rootLandscape: { flexDirection: 'row' },
  tableArea: { flex: 1 },
  tableAreaLandscape: { minWidth: 0 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  handDock: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  handDockLandscape: {
    width: 340,
    maxWidth: '42%',
    flexShrink: 0,
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    paddingTop: 8,
    paddingBottom: 8,
  },
});