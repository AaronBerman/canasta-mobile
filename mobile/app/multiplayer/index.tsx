import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MULTIPLAYER_ENABLED } from '../../constants/features';
import { useCosmetics } from '../../stores/cosmetics-store';
import { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import { useCosmeticFonts } from '../../hooks/useCosmeticFonts';
import { useMeldPanelProps } from '../../hooks/useMeldPanelProps';
import { GameScreenLayout } from '../../components/game/GameScreenLayout';
import { getOtherPlayerSeats } from '../../components/game/other-players';
import { DEFAULT_MULTIPLAYER_URL } from '../../services/multiplayer-client';

type Phase = 'menu' | 'lobby' | 'game';

export default function MultiplayerScreen() {
  if (!MULTIPLAYER_ENABLED) {
    return <Redirect href="/" />;
  }
  return <MultiplayerScreenContent />;
}

function MultiplayerScreenContent() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [displayName, setDisplayName] = useState('Player');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedCardBack, selectedFontStyle, selectedTableSkin } = useCosmetics();
  const fontsReady = useCosmeticFonts(selectedFontStyle.fontFamily);

  const mp = useMultiplayerGame({
    onGameStarted: () => setPhase('game'),
  });
  const meldPanel = useMeldPanelProps(mp);

  const onCreate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await mp.createRoom(displayName.trim() || 'Player');
      setPhase('lobby');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create room');
    } finally {
      setBusy(false);
    }
  }, [displayName, mp]);

  const onJoin = useCallback(async () => {
    if (!joinCode.trim()) {
      setError('Enter a room code');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await mp.joinRoom(joinCode.trim(), displayName.trim() || 'Player');
      setPhase('lobby');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join room');
    } finally {
      setBusy(false);
    }
  }, [displayName, joinCode, mp]);

  const isHost = mp.playerId != null && mp.lobby?.hostUserId === mp.playerId;

  if (phase === 'game' && mp.state) {
    const otherPlayers = getOtherPlayerSeats(mp.state).map((p) => ({
      ...p,
      isActive: p.isActive,
    }));

    return (
      <GameScreenLayout
        game={mp}
        fontsReady={fontsReady}
        tableSkin={selectedTableSkin}
        cardBack={selectedCardBack}
        fontStyle={selectedFontStyle}
        meldPanel={meldPanel}
        otherPlayers={otherPlayers}
      />
    );
  }

  if (phase === 'lobby' && mp.lobby) {
    const mySeat = mp.lobby.seats.find((s) => s.seatId === mp.seatId);
    const ready = mySeat?.ready ?? false;

    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Room {mp.roomCode}</Text>
        <Text style={styles.subtitle}>Share this code with friends. Empty seats become AI.</Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{mp.roomCode}</Text>
        </View>

        <View style={styles.seats}>
          {mp.lobby.seats.map((seat) => (
            <View key={seat.seatId} style={styles.seatRow}>
              <Text style={styles.seatLabel}>
                {seat.seatId === mp.seatId ? 'You · ' : ''}
                Team {seat.teamId + 1}
              </Text>
              <Text style={styles.seatName}>
                {seat.displayName ?? 'Empty'}
                {seat.isAI ? ' (AI)' : ''}
              </Text>
              <Text style={seat.ready ? styles.readyOn : styles.readyOff}>
                {seat.userId ? (seat.ready ? 'Ready' : 'Not ready') : '—'}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.secondaryButton, ready && styles.readyButtonActive]}
          onPress={() => mp.setReady(!ready)}
        >
          <Text style={styles.secondaryButtonText}>{ready ? 'Not Ready' : 'Ready'}</Text>
        </Pressable>

        {isHost && (
          <Pressable style={styles.primaryButton} onPress={mp.startGame}>
            <Ionicons name="play" size={20} color="#0f172a" />
            <Text style={styles.primaryButtonText}>Start Game</Text>
          </Pressable>
        )}

        {!isHost && (
          <Text style={styles.waitHint}>Waiting for host to start…</Text>
        )}

        <Pressable
          style={styles.linkBtn}
          onPress={() => {
            mp.disconnect();
            setPhase('menu');
          }}
        >
          <Text style={styles.linkBtnText}>Leave Room</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Multiplayer</Text>
      <Text style={styles.subtitle}>
        Play online with friends. Create a room or join with a code. Relaxed rules, 3,500 target.
      </Text>

      <Text style={styles.fieldLabel}>Your name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Display name"
        placeholderTextColor="#64748b"
        autoCapitalize="words"
      />

      <Pressable style={styles.primaryButton} onPress={onCreate} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <>
            <Ionicons name="add-circle" size={20} color="#0f172a" />
            <Text style={styles.primaryButtonText}>Create Room</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.dividerLabel}>or join</Text>

      <Text style={styles.fieldLabel}>Room code</Text>
      <TextInput
        style={styles.input}
        value={joinCode}
        onChangeText={setJoinCode}
        placeholder="ABCDEF"
        placeholderTextColor="#64748b"
        autoCapitalize="characters"
        maxLength={6}
      />

      <Pressable style={styles.secondaryButton} onPress={onJoin} disabled={busy}>
        <Text style={styles.secondaryButtonText}>Join Room</Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.serverHint}>
        Server: {DEFAULT_MULTIPLAYER_URL}
        {'\n'}
        Run `npm run server` from the repo root. On a device, set EXPO_PUBLIC_MULTIPLAYER_URL to
        your PC&apos;s LAN IP (e.g. ws://192.168.1.10:3847).
      </Text>

      <Link href="/" asChild>
        <Pressable style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>Back to Home</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 20, paddingBottom: 32 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
    fontSize: 13,
  },
  fieldLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  readyButtonActive: {
    borderColor: '#86efac',
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerLabel: {
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 8,
    fontSize: 12,
  },
  codeBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  codeText: {
    color: '#fbbf24',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
  },
  seats: { gap: 8, marginBottom: 16 },
  seatRow: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  seatLabel: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  seatName: { color: '#f8fafc', fontWeight: '700', fontSize: 15, marginTop: 2 },
  readyOn: { color: '#86efac', fontSize: 11, marginTop: 4 },
  readyOff: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  waitHint: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 13,
  },
  errorText: {
    color: '#f87171',
    textAlign: 'center',
    marginBottom: 12,
  },
  serverHint: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  linkBtn: { padding: 12, alignItems: 'center' },
  linkBtnText: { color: '#94a3b8', fontSize: 14 },
});
