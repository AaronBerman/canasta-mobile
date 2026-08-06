import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  GameRules,
  Meld,
  Rank,
  getCanastaType,
  canastaTypeLabel,
  describeRedThreeScore,
} from '../../engine/index';
import { FontStyleCosmetic } from '../../constants/cosmetics/types';
import { PlayingCard } from '../cards/PlayingCard';

interface TeamMeldsProps {
  melds: Meld[];
  redThrees: Card[];
  teamHasMelded: boolean;
  rules: GameRules;
  teamLabel: string;
  fontStyle: FontStyleCosmetic;
  isHumanTeam?: boolean;
  layout?: 'default' | 'compact';
  showEmpty?: boolean;
  highlightRanks?: Rank[];
  additionCounts?: Partial<Record<Rank, number>>;
  targetMeldRank?: Rank | null;
  selectableTargetRanks?: Rank[];
  meldSelectionEnabled?: boolean;
  onSelectTargetMeld?: (rank: Rank) => void;
}

export function TeamMeldsPanel({
  melds,
  redThrees,
  teamHasMelded,
  rules,
  teamLabel,
  fontStyle,
  isHumanTeam,
  layout = 'default',
  showEmpty = false,
  highlightRanks = [],
  additionCounts = {},
  targetMeldRank = null,
  selectableTargetRanks = [],
  meldSelectionEnabled = false,
  onSelectTargetMeld,
}: TeamMeldsProps) {
  const isEmpty = melds.length === 0 && redThrees.length === 0;
  if (isEmpty && !showEmpty) return null;

  if (layout === 'compact') {
    return (
      <CompactTeamMelds
        melds={melds}
        redThrees={redThrees}
        teamHasMelded={teamHasMelded}
        rules={rules}
        teamLabel={teamLabel}
        fontStyle={fontStyle}
        isHumanTeam={isHumanTeam}
        isEmpty={isEmpty}
        highlightRanks={highlightRanks}
        additionCounts={additionCounts}
        targetMeldRank={targetMeldRank}
        selectableTargetRanks={selectableTargetRanks}
        meldSelectionEnabled={meldSelectionEnabled}
        onSelectTargetMeld={onSelectTargetMeld}
      />
    );
  }

  const highlightSet = new Set(highlightRanks);
  const selectableSet = new Set(selectableTargetRanks);
  const redThreeHint = describeRedThreeScore(redThrees, teamHasMelded, rules);

  return (
    <View style={[styles.panel, isHumanTeam && styles.humanPanel]}>
      <Text style={styles.label}>{teamLabel} — Table</Text>
      {meldSelectionEnabled && selectableTargetRanks.length > 0 && (
        <Text style={styles.targetHint}>Tap a pile to add wild card(s)</Text>
      )}

      {redThrees.length > 0 && (
        <View style={styles.redThreeRow}>
          <View style={styles.redThreeHeader}>
            <Text style={styles.redThreeTitle}>Red 3s</Text>
            <Text
              style={[
                styles.redThreeScore,
                !teamHasMelded && styles.redThreeScorePenalty,
              ]}
            >
              {redThreeHint}
            </Text>
          </View>
          <View style={styles.cards}>
            {redThrees.map((c) => (
              <PlayingCard key={c.id} card={c} fontStyle={fontStyle} width={32} height={44} />
            ))}
          </View>
          {!teamHasMelded && (
            <Text style={styles.redThreeWarn}>
              −{rules.redThreePenaltyNoMeld} each until your team melds
            </Text>
          )}
          {teamHasMelded && redThrees.length === 4 && (
            <Text style={styles.redThreeBonus}>All 4 red 3s — double bonus!</Text>
          )}
        </View>
      )}

      {melds.map((meld) => {
        const willReceive = additionCounts[meld.rank] ?? 0;
        const highlighted = highlightSet.has(meld.rank);
        const isTarget = targetMeldRank === meld.rank;
        const canSelect = meldSelectionEnabled && selectableSet.has(meld.rank);
        const canastaType = getCanastaType(meld);

        const row = (
          <>
            <View style={styles.meldHeader}>
              <Text style={styles.rank}>
                {meld.rank} ({meld.cards.length}
                {willReceive > 0 ? ` +${willReceive}` : ''})
                {isTarget ? ' ← target' : willReceive > 0 ? ' ← adding' : ''}
              </Text>
              {canastaType && (
                <View
                  style={[
                    styles.canastaBadge,
                    canastaType === 'natural'
                      ? styles.canastaNatural
                      : styles.canastaMixed,
                  ]}
                >
                  <Text style={styles.canastaBadgeText}>
                    {canastaTypeLabel(canastaType)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cards}>
              {meld.cards.slice(0, 7).map((c) => (
                <PlayingCard key={c.id} card={c} fontStyle={fontStyle} width={32} height={44} />
              ))}
              {meld.cards.length > 7 && (
                <Text style={styles.more}>+{meld.cards.length - 7}</Text>
              )}
            </View>
          </>
        );

        return (
          <Pressable
            key={meld.rank}
            disabled={!canSelect}
            onPress={() => onSelectTargetMeld?.(meld.rank)}
            style={[
              styles.meldRow,
              highlighted && styles.meldRowHighlight,
              isTarget && styles.meldRowTarget,
              canSelect && styles.meldRowSelectable,
            ]}
          >
            {row}
          </Pressable>
        );
      })}
    </View>
  );
}

function CompactTeamMelds({
  melds,
  redThrees,
  teamHasMelded,
  rules,
  teamLabel,
  fontStyle,
  isHumanTeam,
  isEmpty,
  highlightRanks,
  additionCounts,
  targetMeldRank,
  selectableTargetRanks,
  meldSelectionEnabled,
  onSelectTargetMeld,
}: {
  melds: Meld[];
  redThrees: Card[];
  teamHasMelded: boolean;
  rules: GameRules;
  teamLabel: string;
  fontStyle: FontStyleCosmetic;
  isHumanTeam?: boolean;
  isEmpty: boolean;
  highlightRanks: Rank[];
  additionCounts: Partial<Record<Rank, number>>;
  targetMeldRank: Rank | null;
  selectableTargetRanks: Rank[];
  meldSelectionEnabled: boolean;
  onSelectTargetMeld?: (rank: Rank) => void;
}) {
  const highlightSet = new Set(highlightRanks);
  const selectableSet = new Set(selectableTargetRanks);
  const redThreeHint =
    redThrees.length > 0
      ? describeRedThreeScore(redThrees, teamHasMelded, rules)
      : null;
  const cardW = 28;
  const cardH = 38;

  return (
    <View style={[styles.compactPanel, isHumanTeam && styles.compactHuman]}>
      <View style={styles.compactHeader}>
        <Text style={[styles.compactLabel, isHumanTeam && styles.compactLabelYou]}>
          {teamLabel}
        </Text>
        {redThreeHint && (
          <Text
            style={[
              styles.compactRed3,
              !teamHasMelded && styles.compactRed3Penalty,
            ]}
          >
            R3: {redThreeHint}
          </Text>
        )}
        {meldSelectionEnabled && selectableTargetRanks.length > 0 && (
          <Text style={styles.compactTapHint}>Tap pile for wild</Text>
        )}
      </View>

      {isEmpty ? (
        <Text style={styles.compactEmpty}>No melds on table</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactScroll}
          nestedScrollEnabled
        >
          {redThrees.map((c) => (
            <View key={c.id} style={styles.compactChip}>
              <PlayingCard card={c} fontStyle={fontStyle} width={cardW} height={cardH} />
            </View>
          ))}

          {melds.map((meld) => {
            const willReceive = additionCounts[meld.rank] ?? 0;
            const highlighted = highlightSet.has(meld.rank);
            const isTarget = targetMeldRank === meld.rank;
            const canSelect = meldSelectionEnabled && selectableSet.has(meld.rank);
            const canastaType = getCanastaType(meld);

            return (
              <Pressable
                key={meld.rank}
                disabled={!canSelect}
                onPress={() => onSelectTargetMeld?.(meld.rank)}
                style={[
                  styles.compactChip,
                  highlighted && styles.compactChipHighlight,
                  isTarget && styles.compactChipTarget,
                  canSelect && styles.compactChipSelectable,
                ]}
              >
                <View style={styles.compactChipTop}>
                  <Text style={styles.compactRank}>
                    {meld.rank}
                    {willReceive > 0 ? `+${willReceive}` : ''}
                  </Text>
                  {canastaType && (
                    <Text style={styles.compactCanasta}>
                      {canastaType === 'natural' ? '★' : '◆'}
                    </Text>
                  )}
                </View>
                <View style={styles.compactCards}>
                  {meld.cards.slice(0, 4).map((c) => (
                    <PlayingCard
                      key={c.id}
                      card={c}
                      fontStyle={fontStyle}
                      width={cardW}
                      height={cardH}
                    />
                  ))}
                  {meld.cards.length > 4 && (
                    <Text style={styles.compactMore}>+{meld.cards.length - 4}</Text>
                  )}
                </View>
                <Text style={styles.compactCount}>{meld.cards.length}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  humanPanel: {
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  label: { color: '#e2e8f0', fontSize: 10, fontWeight: '700', marginBottom: 6 },
  targetHint: {
    color: '#fde047',
    fontSize: 9,
    marginBottom: 6,
    fontWeight: '600',
  },
  redThreeRow: {
    marginBottom: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(127,29,29,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.45)',
  },
  redThreeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  redThreeTitle: {
    color: '#fecaca',
    fontSize: 10,
    fontWeight: '800',
  },
  redThreeScore: {
    color: '#86efac',
    fontSize: 10,
    fontWeight: '700',
  },
  redThreeScorePenalty: {
    color: '#f87171',
  },
  redThreeWarn: {
    color: '#fca5a5',
    fontSize: 9,
    marginTop: 4,
  },
  redThreeBonus: {
    color: '#fde047',
    fontSize: 9,
    marginTop: 4,
    fontWeight: '600',
  },
  meldRow: {
    marginBottom: 4,
    borderRadius: 6,
    padding: 4,
  },
  meldRowHighlight: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.5)',
  },
  meldRowTarget: {
    backgroundColor: 'rgba(56,189,248,0.25)',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  meldRowSelectable: {
    borderWidth: 1,
    borderColor: 'rgba(253,224,71,0.5)',
    borderStyle: 'dashed',
  },
  meldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  rank: { color: '#94a3b8', fontSize: 10, flex: 1 },
  canastaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  canastaNatural: {
    backgroundColor: 'rgba(220,38,38,0.85)',
  },
  canastaMixed: {
    backgroundColor: 'rgba(30,41,59,0.95)',
    borderWidth: 1,
    borderColor: '#64748b',
  },
  canastaBadgeText: {
    color: '#f8fafc',
    fontSize: 8,
    fontWeight: '800',
  },
  cards: { flexDirection: 'row', gap: 2, alignItems: 'center', flexWrap: 'wrap' },
  more: { color: '#64748b', fontSize: 10 },
  compactPanel: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  compactHuman: {
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  compactLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  compactLabelYou: {
    color: '#fde047',
  },
  compactRed3: {
    color: '#86efac',
    fontSize: 9,
    fontWeight: '600',
  },
  compactRed3Penalty: {
    color: '#f87171',
  },
  compactTapHint: {
    color: '#fde047',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  compactEmpty: {
    color: '#475569',
    fontSize: 10,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  compactScroll: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  compactChip: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(15,23,42,0.5)',
    minWidth: 44,
  },
  compactChipHighlight: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.5)',
  },
  compactChipTarget: {
    backgroundColor: 'rgba(56,189,248,0.2)',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  compactChipSelectable: {
    borderWidth: 1,
    borderColor: 'rgba(253,224,71,0.45)',
    borderStyle: 'dashed',
  },
  compactChipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  compactRank: {
    color: '#e2e8f0',
    fontSize: 9,
    fontWeight: '800',
  },
  compactCanasta: {
    color: '#fbbf24',
    fontSize: 8,
  },
  compactCards: {
    flexDirection: 'row',
    gap: 1,
    alignItems: 'center',
  },
  compactMore: {
    color: '#64748b',
    fontSize: 8,
    marginLeft: 2,
  },
  compactCount: {
    color: '#64748b',
    fontSize: 8,
    marginTop: 2,
  },
});
