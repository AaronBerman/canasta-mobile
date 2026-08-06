import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { MatchState } from '../engine/index';
import { getCampaignLevel } from '../constants/campaign/levels';
import { startCampaignLevel } from '../constants/campaign/match-setup';
import {
  createEmptyRunStats,
  CampaignRunStats,
  LevelCompletionResult,
  CampaignLevel,
} from '../constants/campaign/types';
import {
  isObjectiveComplete,
  objectiveLabel,
  buildCompletionResult,
  updateRunStats,
} from '../constants/campaign/objectives';
import {
  markIntroTutorialComplete,
  recordCampaignLevelComplete,
} from '../services/campaign-storage';
import { useSinglePlayerGame } from './useSinglePlayerGame';
import { useCosmetics } from '../stores/cosmetics-store';
import { getCosmeticById } from '../constants/cosmetics/catalog';

function isHandFinished(phase: MatchState['phase']): boolean {
  return phase === 'handOver' || phase === 'gameOver';
}

export interface UseCampaignGameOptions {
  /** Play the pre-map intro hand; skips level progress recording. */
  introTutorial?: boolean;
  /** Override level lookup (e.g. intro tutorial level). */
  level?: CampaignLevel;
}

export function useCampaignGame(levelId: number, options: UseCampaignGameOptions = {}) {
  const router = useRouter();
  const { refresh: refreshCosmetics } = useCosmetics();
  const introTutorial = options.introTutorial ?? false;
  const level = useMemo(
    () => options.level ?? getCampaignLevel(levelId),
    [levelId, options.level],
  );

  const initialMatch = useMemo(() => {
    if (!level) return undefined;
    return startCampaignLevel(level);
  }, [level]);

  const [levelComplete, setLevelComplete] = useState(false);
  const [handFailed, setHandFailed] = useState(false);
  const [completion, setCompletion] = useState<LevelCompletionResult | null>(null);
  const [unlockMessages, setUnlockMessages] = useState<string[]>([]);
  const statsRef = useRef<CampaignRunStats>(createEmptyRunStats());
  const recordedRef = useRef(false);
  const pauseRef = useRef(false);
  const campaignPrevStateRef = useRef<MatchState | null>(null);

  const tryCompleteLevel = useCallback(
    (prev: MatchState | null, next: MatchState) => {
      if (!level) return;

      if (isHandFinished(next.phase)) {
        pauseRef.current = true;
        if (
          !recordedRef.current &&
          !isObjectiveComplete(next, level, statsRef.current)
        ) {
          setHandFailed(true);
        }
      }

      if (prev) {
        statsRef.current = updateRunStats(prev, next, statsRef.current, level);
      }

      if (recordedRef.current) return;
      if (!isObjectiveComplete(next, level, statsRef.current)) return;

      recordedRef.current = true;
      pauseRef.current = true;
      setHandFailed(false);
      setLevelComplete(true);

      const result = buildCompletionResult(next, level, statsRef.current, false);
      setCompletion(result);

      void (async () => {
        if (introTutorial) {
          await markIntroTutorialComplete();
          setUnlockMessages([]);
          return;
        }

        const { newlyUnlocked } = await recordCampaignLevelComplete(
          level.id,
          result.stars,
          level.rewardCosmeticId,
        );
        setUnlockMessages(
          newlyUnlocked.map((id) => {
            const c = getCosmeticById(id);
            return c ? `Unlocked: ${c.name}` : id;
          }),
        );
        await refreshCosmetics();
      })();
    },
    [introTutorial, level, refreshCosmetics],
  );

  const onAfterAction = useCallback(
    (prev: MatchState, next: MatchState) => {
      tryCompleteLevel(prev, next);
    },
    [tryCompleteLevel],
  );

  const game = useSinglePlayerGame({
    initialMatch,
    recordProgress: false,
    pauseAI: levelComplete,
    shouldPauseAI: () => pauseRef.current,
    aiDifficulties: level?.aiDifficulties,
    onAfterAction,
  });

  useEffect(() => {
    const next = game.state;
    if (!next) return;
    const prev = campaignPrevStateRef.current;
    if (prev !== next && isHandFinished(next.phase)) {
      tryCompleteLevel(prev, next);
    }
    campaignPrevStateRef.current = next;
  }, [game.state, tryCompleteLevel]);

  const retryLevel = useCallback(() => {
    if (!level) return;
    statsRef.current = createEmptyRunStats();
    recordedRef.current = false;
    pauseRef.current = false;
    campaignPrevStateRef.current = null;
    setLevelComplete(false);
    setHandFailed(false);
    setCompletion(null);
    setUnlockMessages([]);
    game.initFromMatch(startCampaignLevel(level));
  }, [level, game]);

  const goToCampaignMap = useCallback(() => {
    router.replace('/campaign');
  }, [router]);

  const goToNextLevel = useCallback(() => {
    if (introTutorial || !level) {
      router.replace('/campaign');
      return;
    }
    if (level.id >= 50) {
      router.replace('/campaign');
    } else {
      router.replace(`/campaign/${level.id + 1}`);
    }
  }, [introTutorial, level, router]);

  return {
    level,
    game,
    levelComplete,
    handFailed,
    completion,
    unlockMessages,
    introTutorial,
    objectiveLabel: level ? objectiveLabel(level.objective) : '',
    retryLevel,
    goToCampaignMap,
    goToNextLevel,
  };
}
