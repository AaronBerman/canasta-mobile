import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AIDifficultySelector } from './AIDifficultySelector';
import {
  AIDifficultySettings,
  DEFAULT_AI_DIFFICULTY,
  loadAIDifficultySettings,
  saveAIDifficultySettings,
} from '../../services/ai-difficulty-storage';

export function AIDifficultySettingsPanel() {
  const [aiDifficulty, setAiDifficulty] =
    useState<AIDifficultySettings>(DEFAULT_AI_DIFFICULTY);

  useEffect(() => {
    loadAIDifficultySettings().then(setAiDifficulty);
  }, []);

  const onChange = useCallback((next: AIDifficultySettings) => {
    setAiDifficulty(next);
    void saveAIDifficultySettings(next);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.sub}>
        Set partner and opponent difficulty for single-player games. Changes save automatically.
      </Text>
      <AIDifficultySelector value={aiDifficulty} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  sub: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
  },
});
