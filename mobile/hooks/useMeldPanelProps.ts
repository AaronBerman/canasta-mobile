import { useMemo } from 'react';
import type { SinglePlayerGameHandle } from './game/types';

export function useMeldPanelProps(game: SinglePlayerGameHandle) {
  return useMemo(
    () => ({
      highlightRanks: game.meldUiActive ? game.additionHighlightRanks : [],
      additionCounts: game.meldUiActive ? game.additionCounts : {},
      targetMeldRank: game.targetMeldRank,
      selectableTargetRanks: game.meldUiActive ? game.selectableTargetRanks : [],
      meldSelectionEnabled: game.meldUiActive && game.selectedCardIds.size > 0,
      onSelectTargetMeld: game.selectTargetMeld,
    }),
    [
      game.meldUiActive,
      game.additionHighlightRanks,
      game.additionCounts,
      game.targetMeldRank,
      game.selectableTargetRanks,
      game.selectedCardIds.size,
      game.selectTargetMeld,
    ],
  );
}
