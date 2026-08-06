import { getPartnerIndex, getSeatsInTurnOrderAfter, MatchState } from '../../engine/index';
import { OtherPlayerSeat } from './OtherPlayersDropdown';

export function getOtherPlayerSeats(state: MatchState): OtherPlayerSeat[] {
  const { humanSeat, players } = state;
  const partnerIdx = getPartnerIndex(humanSeat, players.length);
  const turnOrder = getSeatsInTurnOrderAfter(humanSeat, players.length);

  return turnOrder.map((seat) => {
    const p = players[seat];
    return {
      id: p.id,
      role: seat === partnerIdx ? ('P' as const) : ('O' as const),
      name: p.name,
      cardCount: p.hand.length,
      isActive: state.currentPlayer === p.id,
    };
  });
}
