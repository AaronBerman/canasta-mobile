import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCosmetics } from '../../stores/cosmetics-store';
import { useCampaignGame } from '../../hooks/useCampaignGame';
import { useCosmeticFonts } from '../../hooks/useCosmeticFonts';
import { useMeldPanelProps } from '../../hooks/useMeldPanelProps';
import { GameScreenLayout } from '../../components/game/GameScreenLayout';
import { CampaignObjectiveBar } from '../../components/game/CampaignObjectiveBar';
import { CampaignResultModal } from '../../components/game/CampaignResultModal';
import { getOtherPlayerSeats } from '../../components/game/other-players';
import { INTRO_TUTORIAL_LEVEL } from '../../constants/campaign/intro-tutorial';

export default function IntroTutorialScreen() {
  const { selectedCardBack, selectedFontStyle, selectedTableSkin } = useCosmetics();
  const fontsReady = useCosmeticFonts(selectedFontStyle.fontFamily);
  const campaign = useCampaignGame(0, {
    introTutorial: true,
    level: INTRO_TUTORIAL_LEVEL,
  });
  const { level, game, levelComplete, handFailed, completion, unlockMessages } = campaign;
  const meldPanel = useMeldPanelProps(game);

  const otherPlayers =
    game.state && !game.loading
      ? getOtherPlayerSeats(game.state).map((p) => ({
          ...p,
          isActive: p.isActive && !levelComplete,
        }))
      : undefined;

  const footer = (
    <>
      {handFailed && !levelComplete && (
        <View style={styles.handFailedBanner}>
          <Text style={styles.handFailedText}>Try again — draw, meld three 7s, then discard.</Text>
          <Pressable style={styles.retryBtn} onPress={campaign.retryLevel}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </>
  );

  return (
    <>
      <GameScreenLayout
        game={game}
        fontsReady={fontsReady}
        tableSkin={selectedTableSkin}
        cardBack={selectedCardBack}
        fontStyle={selectedFontStyle}
        meldPanel={meldPanel}
        otherPlayers={otherPlayers}
        showTurnPhase={!levelComplete}
        handEnabled={game.isMyTurn && !levelComplete}
        showActionBar={!levelComplete && !game.handEnded}
        headerExtra={
          level ? (
            <CampaignObjectiveBar
              embedded
              levelTitle={level.title}
              chapter={level.chapter}
              objectiveLabel={campaign.objectiveLabel}
              hint={level.hint}
              levelComplete={levelComplete}
            />
          ) : null
        }
        footer={footer}
      />

      <CampaignResultModal
        visible={levelComplete}
        levelTitle={level?.title ?? 'Quick Start'}
        completion={completion}
        unlockMessages={unlockMessages}
        hasNextLevel={false}
        successTitle="You're ready!"
        primaryButtonLabel="Continue to Campaign"
        mapButtonLabel="Campaign Map"
        hideStars
        onRetry={campaign.retryLevel}
        onNextLevel={campaign.goToCampaignMap}
        onMap={campaign.goToCampaignMap}
      />
    </>
  );
}

const styles = StyleSheet.create({
  handFailedBanner: {
    backgroundColor: '#451a03',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#7c2d12',
    gap: 10,
  },
  handFailedText: {
    color: '#fdba74',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 14,
  },
});
