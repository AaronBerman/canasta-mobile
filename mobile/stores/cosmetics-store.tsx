import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  CardBackCosmetic,
  CosmeticCategory,
  FontStyleCosmetic,
  PlayerCosmetics,
  TableSkinCosmetic,
} from '../constants/cosmetics/types';
import { DEFAULT_COSMETICS } from '../constants/cosmetics/types';
import {
  CARD_BACKS,
  FONT_STYLES,
  TABLE_SKINS,
  getCosmeticById,
} from '../constants/cosmetics/catalog';
import {
  canUnlockByProgress,
  isUnlocked,
  loadCosmetics,
  loadProgress,
  PlayerProgress,
  saveCosmetics,
  selectCosmetic,
  unlockCosmetic,
} from '../services/cosmetics-storage';
import { loadCampaignProgress, canUnlockByCampaign } from '../services/campaign-storage';
import type { CampaignProgress } from '../constants/campaign/storage-types';
import { unlockViaRewardedAd } from '../services/ad-reward-service';

interface CosmeticsContextValue {
  ready: boolean;
  cosmetics: PlayerCosmetics;
  progress: PlayerProgress;
  selectedCardBack: CardBackCosmetic;
  selectedFontStyle: FontStyleCosmetic;
  selectedTableSkin: TableSkinCosmetic;
  isOwned: (id: string) => boolean;
  canClaim: (id: string) => boolean;
  equip: (category: CosmeticCategory, id: string) => Promise<void>;
  unlockWithAd: (id: string) => Promise<string | null>;
  claimProgressUnlock: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CosmeticsContext = createContext<CosmeticsContextValue | null>(null);

function resolveSelected<T>(id: string, fallback: T, list: T[]): T {
  return (list as Array<T & { id: string }>).find((item) => item.id === id) ?? fallback;
}

export function CosmeticsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cosmetics, setCosmetics] = useState<PlayerCosmetics>(DEFAULT_COSMETICS);
  const [progress, setProgress] = useState<PlayerProgress>({ singlePlayerWins: 0, singlePlayerPoints: 0 });
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgress | null>(null);

  const refresh = useCallback(async () => {
    const [loadedCosmetics, loadedProgress, loadedCampaign] = await Promise.all([
      loadCosmetics(),
      loadProgress(),
      loadCampaignProgress(),
    ]);
    setCosmetics(loadedCosmetics);
    setProgress(loadedProgress);
    setCampaignProgress(loadedCampaign);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedCardBack = useMemo(
    () =>
      resolveSelected(
        cosmetics?.selectedCardBackId ?? 'back-classic',
        CARD_BACKS[0],
        CARD_BACKS,
      ),
    [cosmetics?.selectedCardBackId],
  );

  const selectedFontStyle = useMemo(
    () =>
      resolveSelected(
        cosmetics?.selectedFontStyleId ?? 'font-system',
        FONT_STYLES[0],
        FONT_STYLES,
      ),
    [cosmetics?.selectedFontStyleId],
  );

  const selectedTableSkin = useMemo(
    () =>
      resolveSelected(
        cosmetics?.selectedTableSkinId ?? 'table-classic-green',
        TABLE_SKINS[0],
        TABLE_SKINS,
      ),
    [cosmetics?.selectedTableSkinId],
  );

  const isOwned = useCallback(
    (id: string) => (cosmetics ? isUnlocked(cosmetics, id) : false),
    [cosmetics],
  );

  const canClaim = useCallback(
    (id: string) => {
      if (!cosmetics || isUnlocked(cosmetics, id)) return false;
      const item = getCosmeticById(id);
      if (!item) return false;
      if (item.unlock.method === 'rewarded_ad') return false;
      if (item.unlock.method === 'campaign_level') {
        return campaignProgress ? canUnlockByCampaign(id, campaignProgress) : false;
      }
      return canUnlockByProgress(id, progress, campaignProgress ?? undefined);
    },
    [cosmetics, progress, campaignProgress],
  );

  const equip = useCallback(
    async (category: CosmeticCategory, id: string) => {
      if (!cosmetics || !isUnlocked(cosmetics, id)) return;
      const updated = selectCosmetic(cosmetics, category, id);
      setCosmetics(updated);
      await saveCosmetics(updated);
    },
    [cosmetics],
  );

  const unlockWithAd = useCallback(async (id: string) => {
    const result = await unlockViaRewardedAd(id);
    if (result.success) {
      await refresh();
      return result.message;
    }
    return null;
  }, [refresh]);

  const claimProgressUnlock = useCallback(
    async (id: string) => {
      if (!cosmetics) return;
      const item = getCosmeticById(id);
      const eligible =
        item?.unlock.method === 'campaign_level'
          ? campaignProgress && canUnlockByCampaign(id, campaignProgress)
          : canUnlockByProgress(id, progress, campaignProgress ?? undefined);
      if (!eligible) return;
      const updated = unlockCosmetic(cosmetics, id);
      setCosmetics(updated);
      await saveCosmetics(updated);
    },
    [cosmetics, progress, campaignProgress],
  );

  return (
    <CosmeticsContext.Provider
      value={{
        ready,
        cosmetics,
        progress,
        selectedCardBack,
        selectedFontStyle,
        selectedTableSkin,
        isOwned,
        canClaim,
        equip,
        unlockWithAd,
        claimProgressUnlock,
        refresh,
      }}
    >
      {children}
    </CosmeticsContext.Provider>
  );
}

export function useCosmetics() {
  const ctx = useContext(CosmeticsContext);
  if (!ctx) throw new Error('useCosmetics must be used within CosmeticsProvider');
  return ctx;
}
