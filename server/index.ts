import { WebSocketServer, WebSocket } from 'ws';
import { randomBytes } from 'crypto';
import { createLobby, joinSeat, fillEmptySeatsWithAI, Lobby, LobbySeat } from '../src/multiplayer/lobby.js';
import { createMultiplayerMatch } from '../src/match-factory.js';
import { RELAXED_RULES } from '../src/core/game-rules.js';
import { MatchState, isAIPlayer, checkStockExhaustion } from '../src/core/turn-manager.js';
import { executeAITurn, recoverAITurn } from '../src/ai/ai-executor.js';
import { applyMultiplayerAction, ClientMessage, ServerMessage } from '../src/multiplayer/actions.js';
import { filterMatchStateForSeat } from '../src/multiplayer/state-filter.js';

const PORT = Number(process.env.PORT ?? 3847);

interface ConnectedPlayer {
  ws: WebSocket;
  playerId: string;
  displayName: string;
  seatId: number;
}

interface Room {
  code: string;
  lobby: Lobby;
  hostPlayerId: string;
  players: Map<string, ConnectedPlayer>;
  match: MatchState | null;
  aiTimer: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return rooms.has(code) ? generateCode() : code;
}

function generatePlayerId(): string {
  return `p_${randomBytes(8).toString('hex')}`;
}

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastRoom(room: Room, message: ServerMessage, except?: WebSocket): void {
  for (const player of room.players.values()) {
    if (player.ws !== except) send(player.ws, message);
  }
}

function broadcastLobby(room: Room): void {
  const msg: ServerMessage = { type: 'lobbyUpdate', lobby: serializeLobby(room.lobby) };
  broadcastRoom(room, msg);
}

function serializeLobby(lobby: Lobby): Lobby {
  return {
    ...lobby,
    createdAt: lobby.createdAt,
  };
}

function syncState(room: Room): void {
  if (!room.match) return;
  for (const player of room.players.values()) {
    send(player.ws, {
      type: 'stateSync',
      state: filterMatchStateForSeat(room.match, player.seatId),
    });
  }
}

function scheduleAi(room: Room): void {
  if (room.aiTimer) clearTimeout(room.aiTimer);
  room.aiTimer = null;
  if (!room.match || room.match.phase !== 'playing') return;
  if (!isAIPlayer(room.match)) return;

  room.aiTimer = setTimeout(() => {
    room.aiTimer = null;
    if (!room.match || room.match.phase !== 'playing' || !isAIPlayer(room.match)) return;

    const stockEnd = checkStockExhaustion(room.match);
    if (stockEnd?.ok) {
      room.match = stockEnd.state;
      syncState(room);
      scheduleAi(room);
      return;
    }

    let result = executeAITurn(room.match);
    if (!result.ok) result = recoverAITurn(result.state);
    room.match = result.state;
    syncState(room);
    scheduleAi(room);
  }, 900);
}

function findRoomByPlayer(playerId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.has(playerId)) return room;
  }
  return undefined;
}

function assignSeat(lobby: Lobby): number | null {
  const open = lobby.seats.find((s) => s.userId === null && !s.isAI);
  return open?.seatId ?? null;
}

function handleStartGame(room: Room, playerId: string): void {
  if (playerId !== room.hostPlayerId) {
    const host = [...room.players.values()].find((p) => p.playerId === playerId);
    if (host) send(host.ws, { type: 'error', message: 'Only the host can start the game' });
    return;
  }

  let lobby = room.lobby;
  lobby = fillEmptySeatsWithAI(lobby, 'medium');
  lobby = { ...lobby, status: 'inProgress' };
  room.lobby = lobby;

  room.match = createMultiplayerMatch(lobby, RELAXED_RULES);
  broadcastRoom(room, { type: 'gameStarted', code: room.code });
  syncState(room);
  scheduleAi(room);
}

function handleAction(room: Room, playerId: string, payload: ClientMessage & { type: 'action' }): void {
  const conn = room.players.get(playerId);
  if (!conn || !room.match) {
    if (conn) send(conn.ws, { type: 'error', message: 'Game not started' });
    return;
  }

  const result = applyMultiplayerAction(room.match, conn.seatId, payload.payload);
  if (!result.ok) {
    send(conn.ws, { type: 'error', message: result.error });
    return;
  }

  room.match = result.state;
  syncState(room);
  scheduleAi(room);
}

function handleMessage(ws: WebSocket, playerId: string, raw: string): void {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw) as ClientMessage;
  } catch {
    send(ws, { type: 'error', message: 'Invalid message' });
    return;
  }

  switch (msg.type) {
    case 'createRoom': {
      const code = generateCode();
      const hostId = playerId;
      const lobby = createLobby(hostId, msg.playerCount ?? 4);
      lobby.seats[0].displayName = msg.displayName;
      const room: Room = {
        code,
        lobby,
        hostPlayerId: hostId,
        players: new Map(),
        match: null,
        aiTimer: null,
      };
      rooms.set(code, room);
      room.players.set(hostId, { ws, playerId: hostId, displayName: msg.displayName, seatId: 0 });
      send(ws, { type: 'roomCreated', code, playerId: hostId, seatId: 0 });
      broadcastLobby(room);
      return;
    }
    case 'joinRoom': {
      const room = rooms.get(msg.code.toUpperCase());
      if (!room) {
        send(ws, { type: 'error', message: 'Room not found' });
        return;
      }
      if (room.match) {
        send(ws, { type: 'error', message: 'Game already started' });
        return;
      }
      const seatId = assignSeat(room.lobby);
      if (seatId === null) {
        send(ws, { type: 'error', message: 'Room is full' });
        return;
      }
      room.lobby = joinSeat(room.lobby, seatId, playerId, msg.displayName);
      room.players.set(playerId, { ws, playerId, displayName: msg.displayName, seatId });
      send(ws, { type: 'roomJoined', code: room.code, playerId, seatId });
      broadcastLobby(room);
      if (room.match) syncState(room);
      return;
    }
    case 'setReady': {
      const room = findRoomByPlayer(playerId);
      if (!room) return;
      const conn = room.players.get(playerId);
      if (!conn) return;
      room.lobby = {
        ...room.lobby,
        seats: room.lobby.seats.map((s: LobbySeat) =>
          s.seatId === conn.seatId ? { ...s, ready: msg.ready } : s,
        ),
      };
      broadcastLobby(room);
      return;
    }
    case 'startGame': {
      const room = findRoomByPlayer(playerId);
      if (!room) return;
      handleStartGame(room, playerId);
      return;
    }
    case 'action': {
      const room = findRoomByPlayer(playerId);
      if (!room) return;
      handleAction(room, playerId, msg);
      return;
    }
    default:
      send(ws, { type: 'error', message: 'Unknown message type' });
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  const playerId = generatePlayerId();

  ws.on('message', (data) => {
    handleMessage(ws, playerId, data.toString());
  });

  ws.on('close', () => {
    const room = findRoomByPlayer(playerId);
    if (!room) return;
    const conn = room.players.get(playerId);
    room.players.delete(playerId);
    if (conn && !room.match) {
      room.lobby = {
        ...room.lobby,
        seats: room.lobby.seats.map((s) =>
          s.seatId === conn.seatId
            ? { ...s, userId: null, displayName: null, ready: false, isAI: false }
            : s,
        ),
      };
      broadcastLobby(room);
      broadcastRoom(room, { type: 'playerLeft', seatId: conn.seatId });
    }
    if (room.players.size === 0) {
      if (room.aiTimer) clearTimeout(room.aiTimer);
      rooms.delete(room.code);
    }
  });
});

console.log(`Canasta Table multiplayer server listening on ws://0.0.0.0:${PORT}`);
