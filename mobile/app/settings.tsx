import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AIDifficultySettingsPanel } from '../components/settings/AIDifficultySettingsPanel';
import { CustomizeSettingsPanel } from '../components/settings/CustomizeSettingsPanel';
import { HouseRulesSettingsPanel } from '../components/settings/HouseRulesSettingsPanel';

type SettingsTab = 'ai' | 'customize' | 'rules';

const TABS: { key: SettingsTab; label: string }[] = [
  { key: 'ai', label: 'AI Difficulty' },
  { key: 'customize', label: 'Customize' },
  { key: 'rules', label: 'House Rules' },
];

function parseTab(value: string | string[] | undefined): SettingsTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'customize' || raw === 'rules') return raw;
  return 'ai';
}

export default function SettingsScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => parseTab(tab));

  useEffect(() => {
    setActiveTab(parseTab(tab));
  }, [tab]);

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={activeTab === 'ai' ? styles.panelVisible : styles.panelHidden}>
          <AIDifficultySettingsPanel />
        </View>
        <View style={activeTab === 'customize' ? styles.panelVisible : styles.panelHidden}>
          <CustomizeSettingsPanel />
        </View>
        <View style={activeTab === 'rules' ? styles.panelVisible : styles.panelHidden}>
          <HouseRulesSettingsPanel />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fbbf24',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#0f172a',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  panelVisible: {},
  panelHidden: {
    display: 'none',
  },
});
