# Multiplayer (beta)

Online 4-player partnership Canasta with **room codes**. The game server validates all moves using the same engine as single-player.

## Quick start

**Terminal 1 — game server**

```bash
npm run server
```

Listens on `ws://0.0.0.0:3847` by default.

**Terminal 2 — mobile app**

```bash
cd mobile
npx expo start
```

Home → **Multiplayer** → Create Room or Join with a 6-letter code.

## Testing on a physical device

Expo Go on your phone cannot reach `localhost` on your PC. Set your LAN IP:

```bash
# Windows example — find your IPv4 address with ipconfig
set EXPO_PUBLIC_MULTIPLAYER_URL=ws://192.168.1.10:3847
cd mobile
npx expo start
```

Both devices must be on the same Wi‑Fi network. Allow port **3847** through Windows Firewall if connections fail.

## How it works

| Layer | Role |
|-------|------|
| `server/index.ts` | WebSocket server — rooms, lobby, authoritative state, AI for empty seats |
| `src/multiplayer/actions.ts` | Typed player actions + server-side validation |
| `src/multiplayer/state-filter.ts` | Hides opponent hands before syncing to clients |
| `mobile/services/multiplayer-client.ts` | React Native WebSocket client |
| `mobile/hooks/useMultiplayerGame.ts` | Game hook — sends actions, receives filtered state |

**Flow:** Create room → share code → friends join → Ready → host **Start Game** → empty seats fill with AI → play in real time.

**Rules:** Relaxed preset (3,500 target, 50-point opening meld) for faster online sessions.

## Room protocol (summary)

Client → server:

- `createRoom`, `joinRoom`, `setReady`, `startGame`
- `action` — `drawStock`, `takeDiscardPile`, `layMelds`, `skipMeld`, `discard`

Server → client:

- `roomCreated`, `roomJoined`, `lobbyUpdate`, `gameStarted`, `stateSync`, `error`

## Limitations (v0.1 beta)

- No accounts or friends list — room codes only
- No reconnection mid-game
- Server is in-memory (rooms lost on restart)
- No chat
- Host must start the game manually
- 4 players only (partnership layout)

## Production path

For a public launch you would deploy the server (Fly.io, Railway, etc.), add TLS (`wss://`), persistence, auth, and reconnection. See [ARCHITECTURE.md](ARCHITECTURE.md).
