import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCosmetics } from '../../stores/cosmetics-store';
import { useCampaignGame } from '../../hooks/useCampaignGame';
import { useCosmeticFonts } from '../../hooks/useCosmeticFonts';
import { useMeldPanelProps } from '../../hooks/useMeldPanelProps';
import { GameScreenLayout } from '../../components/game/GameScreenLayout';
import { CampaignObjectiveBar } from '../../components/game/CampaignObjectiveBar';
import { CampaignResultModal } from '../../components/game/CampaignResultModal';
import { getOtherPlayerSeats } from '../../components/game/other-players';

export default function CampaignLevelScreen() {
  const { levelId: levelIdParam } = useLocalSearchParams<{ levelId: string }>();
  const levelId = Math.max(1, Math.min(50, Number(levelIdParam) || 1));
  const { selectedCardBack, selectedFontStyle, selectedTableSkin } = useCosmetics();
  const fontsReady = useCosmeticFonts(selectedFontStyle.fontFamily);
  const campaign = useCampaignGame(levelId);
  const { level, game, levelComplete, handFailed, completion, unlockMessages } = campaign;
  const meldPanel = useMeldPanelProps(game);

  if (!level) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Level not found</Text>
      </View>
    );
  }

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
          <Text style={styles.handFailedText}>Objective not met this hand.</Text>
          <Pressable style={styles.retryBtn} onPress={campaign.retryLevel}>
            <Text style={styles.retryBtnText}>Retry Level</Text>
          </Pressable>
        </View>
      )}

      {game.handEnded && !levelComplete && !handFailed && (
        <View style={styles.handEndedBanner}>
          <Text style={styles.handEndedText}>Hand complete — finishing level…</Text>
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
          <CampaignObjectiveBar
            embedded
            levelTitle={level.title}
            chapter={level.chapter}
            objectiveLabel={campaign.objectiveLabel}
            hint={level.hint}
            levelComplete={levelComplete}
          />
        }
        footer={footer}
      />

      <CampaignResultModal
        visible={levelComplete}
        levelTitle={level.title}
        completion={completion}
        unlockMessages={unlockMessages}
        hasNextLevel={level.id < 50}
        onRetry={campaign.retryLevel}
        onNextLevel={campaign.goToNextLevel}
        onMap={campaign.goToCampaignMap}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  errorText: { color: '#f87171' },
  handEndedBanner: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  handEndedText: {
    color: '#86efac',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
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
