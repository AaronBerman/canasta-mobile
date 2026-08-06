import { memo, RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, isWild, isRedThree, isBlackThree } from '../../engine/index';
import { FontStyleCosmetic } from '../../constants/cosmetics/types';
import { CardBackCosmetic } from '../../constants/cosmetics/types';
import { PlayingCard } from '../cards/PlayingCard';
import { CardBackView } from '../cards/CardBackView';
import { DraggableCard, CARD_SLOT_WIDTH } from './DraggableCard';

interface PlayerHandProps {
  groups: Card[][];
  fontStyle: FontStyleCosmetic;
  selectedIds: Set<string>;
  newCardIds?: Set<string>;
  enabled: boolean;
  onToggleSelect: (cardId: string) => void;
  onSelectGroup: (group: Card[]) => void;
  onDiscardDrag: (card: Card) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAutoGroup: () => void;
  discardZoneYRef: RefObject<number>;
  layout?: 'portrait' | 'landscape';
}

function setsEqual(a?: Set<string>, b?: Set<string>): boolean {
  if (a === b) return true;
  if (!a || !b || a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

function handGroupsEqual(a: Card[][], b: Card[][]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j].id !== b[i][j].id) return false;
    }
  }
  return true;
}

function arePlayerHandPropsEqual(prev: PlayerHandProps, next: PlayerHandProps): boolean {
  return (
    handGroupsEqual(prev.groups, next.groups) &&
    prev.fontStyle.id === next.fontStyle.id &&
    setsEqual(prev.selectedIds, next.selectedIds) &&
    setsEqual(prev.newCardIds, next.newCardIds) &&
    prev.enabled === next.enabled &&
    prev.discardZoneYRef === next.discardZoneYRef &&
    prev.layout === next.layout &&
    prev.onToggleSelect === next.onToggleSelect &&
    prev.onSelectGroup === next.onSelectGroup &&
    prev.onDiscardDrag === next.onDiscardDrag &&
    prev.onReorder === next.onReorder &&
    prev.onAutoGroup === next.onAutoGroup
  );
}

function flatIndex(groups: Card[][], groupIndex: number, cardIndex: number): number {
  let index = 0;
  for (let g = 0; g < groupIndex; g++) index += groups[g].length;
  return index + cardIndex;
}

export const PlayerHand = memo(function PlayerHand({
  groups,
  fontStyle,
  selectedIds,
  newCardIds,
  enabled,
  onToggleSelect,
  onSelectGroup,
  onDiscardDrag,
  onReorder,
  onAutoGroup,
  discardZoneYRef,
  layout = 'portrait',
}: PlayerHandProps) {
  const isLandscape = layout === 'landscape';
  const cardWidth = isLandscape ? 52 : 58;
  const cardHeight = isLandscape ? 74 : 82;
  const slotWidth = isLandscape ? 56 : CARD_SLOT_WIDTH;
  const totalCards = groups.reduce((n, g) => n + g.length, 0);

  const handleReorder = (groupIndex: number, cardIndex: number, translationX: number) => {
    const from = flatIndex(groups, groupIndex, cardIndex);
    const shift = Math.round(translationX / slotWidth);
    if (shift === 0) return;
    const toIndex = Math.max(0, Math.min(totalCards - 1, from + shift));
    if (toIndex !== from) onReorder(from, toIndex);
  };

  const groupLabel = (group: Card[]): string | null => {
    const natural = group.find((c) => !isWild(c) && !isRedThree(c) && !isBlackThree(c));
    if (!natural) {
      if (group.every((c) => isWild(c))) return 'Wild';
      if (group.every(isRedThree)) return 'Red 3';
      if (group.every(isBlackThree)) return 'Black 3';
      return null;
    }
    return natural.rank;
  };

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Your hand · tap to select</Text>
        <Pressable style={styles.groupBtn} onPress={onAutoGroup}>
          <Text style={styles.groupBtnText}>Re-group</Text>
        </Pressable>
      </View>
      <View style={[styles.scrollFrame, isLandscape && styles.scrollFrameLandscape]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          indicatorStyle="white"
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
        >
          {groups.map((group, groupIndex) => {
            const label = groupLabel(group);
            const allSelected = group.every((c) => selectedIds.has(c.id));
            return (
              <View key={`g-${groupIndex}-${group[0]?.id ?? groupIndex}`} style={styles.group}>
                {label && (
                  <Pressable
                    style={[styles.groupTag, allSelected && styles.groupTagSelected]}
                    onPress={() => onSelectGroup(group)}
                    disabled={!enabled}
                  >
                    <Text style={[styles.groupTagText, allSelected && styles.groupTagTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                )}
                <View style={styles.groupCards}>
                  {group.map((card, cardIndex) => (
                    <DraggableCard
                      key={card.id}
                      enabled={enabled}
                      selected={selectedIds.has(card.id)}
                      slotWidth={slotWidth}
                      onTap={() => onToggleSelect(card.id)}
                      onDiscardDrag={(absoluteY) => {
                        if (Math.abs(absoluteY - discardZoneYRef.current) < 140) {
                          onDiscardDrag(card);
                        }
                      }}
                      onReorder={(tx) => handleReorder(groupIndex, cardIndex, tx)}
                    >
                      <PlayingCard
                        card={card}
                        fontStyle={fontStyle}
                        width={cardWidth}
                        height={cardHeight}
                        highlightNew={newCardIds?.has(card.id)}
                      />
                    </DraggableCard>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}, arePlayerHandPropsEqual);

interface OpponentHandProps {
  count: number;
  name: string;
  cardBack: CardBackCosmetic;
  isActive?: boolean;
}

export function OpponentHand({ count, name, cardBack, isActive }: OpponentHandProps) {
  return (
    <View style={[styles.opponent, isActive && styles.opponentActive]}>
      <Text style={styles.opponentName}>{name} ({count})</Text>
      <View style={styles.opponentRow}>
        {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
          <CardBackView key={i} cosmetic={cardBack} width={36} height={50} />
        ))}
        {count > 6 && <Text style={styles.more}>+{count - 6}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  containerLandscape: {
    flex: 1,
    borderTopWidth: 0,
    paddingTop: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    flex: 1,
  },
  groupBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  groupBtnText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  scrollFrame: {
    height: 140,
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#475569',
    overflow: 'hidden',
  },
  scrollFrameLandscape: {
    flex: 1,
    height: undefined,
    minHeight: 88,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 4,
    minWidth: '100%',
  },
  group: {
    marginRight: 10,
    alignItems: 'center',
  },
  groupTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(51,65,85,0.9)',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#475569',
  },
  groupTagSelected: {
    backgroundColor: 'rgba(251,191,36,0.25)',
    borderColor: '#fbbf24',
  },
  groupTagText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  groupTagTextSelected: {
    color: '#fbbf24',
  },
  groupCards: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.5)',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingBottom: 4,
    paddingTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.6)',
  },
  opponent: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    opacity: 0.85,
  },
  opponentActive: {
    opacity: 1,
    backgroundColor: 'rgba(251,191,36,0.15)',
  },
  opponentName: { color: '#f8fafc', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  opponentRow: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  more: { color: '#94a3b8', fontSize: 10, marginLeft: 4 },
});
