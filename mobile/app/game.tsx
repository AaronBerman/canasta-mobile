import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useCosmetics } from '../stores/cosmetics-store';
import { useSinglePlayerGame } from '../hooks/useSinglePlayerGame';
import { useCosmeticFonts } from '../hooks/useCosmeticFonts';
import { useMeldPanelProps } from '../hooks/useMeldPanelProps';
import { GameScreenLayout } from '../components/game/GameScreenLayout';
import { HandResultModal } from '../components/game/HandResultModal';
import { getCosmeticById } from '../constants/cosmetics/catalog';
import { RELAXED_RULES } from '../engine/index';

export default function GameScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isQuickGame = mode === 'quick';
  const rules = useMemo(() => (isQuickGame ? RELAXED_RULES : undefined), [isQuickGame]);

  const { selectedCardBack, selectedFontStyle, selectedTableSkin } = useCosmetics();
  const fontsReady = useCosmeticFonts(selectedFontStyle.fontFamily);
  const game = useSinglePlayerGame({ rules });
  const meldPanel = useMeldPanelProps(game);

  const showResult =
    game.state?.phase === 'handOver' || game.state?.phase === 'gameOver';

  return (
    <>
      <Stack.Screen
        options={{
          title: isQuickGame ? 'Quick Game' : 'Full Match',
        }}
      />

      <GameScreenLayout
        game={game}
        fontsReady={fontsReady}
        tableSkin={selectedTableSkin}
        cardBack={selectedCardBack}
        fontStyle={selectedFontStyle}
        meldPanel={meldPanel}
      />

      {game.state && (
        <HandResultModal
          visible={showResult}
          state={game.state}
          unlockMessages={game.unlockMessages.map((id) => {
            const c = getCosmeticById(id);
            return c ? `Unlocked: ${c.name}` : id;
          })}
          onNextHand={game.onNextHand}
          onNewMatch={game.onNewMatch}
          onDismissUnlocks={game.clearUnlockMessages}
        />
      )}
    </>
  );
}
