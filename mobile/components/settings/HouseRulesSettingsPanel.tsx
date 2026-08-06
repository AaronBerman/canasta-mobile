import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CUSTOMIZABLE_FIELDS,
  getPresetList,
  loadRulesConfig,
  resolveRules,
  saveCustomRules,
  setRulesPreset,
} from '../../services/rules-storage';
import { GameRules } from '../../engine/index';

export function HouseRulesSettingsPanel() {
  const [presetId, setPresetId] = useState('classic');
  const [rules, setRules] = useState<GameRules | null>(null);
  const [overrides, setOverrides] = useState<Partial<GameRules>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const presets = getPresetList();

  const load = useCallback(async () => {
    const config = await loadRulesConfig();
    setPresetId(config.presetId);
    const active = resolveRules(config);
    setRules(active);
    setOverrides(config.customOverrides ?? {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function selectPreset(id: string) {
    setPresetId(id);
    setOverrides({});
    const r = await setRulesPreset(id);
    setRules(r);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function applyCustom() {
    const { rules: r, errors: errs } = await saveCustomRules(presetId, overrides);
    setRules(r);
    setErrors(errs);
    if (errs.length === 0) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function updateOverride(key: keyof GameRules, value: boolean | number) {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }

  if (!rules) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading rules…</Text>
      </View>
    );
  }

  const preview = { ...rules, ...overrides };

  return (
    <View style={styles.container}>
      <Text style={styles.sub}>
        Pick a preset or tweak individual settings. Changes apply to your next game.
      </Text>

      <Text style={styles.heading}>Rule Presets</Text>

      {presets.map((p) => (
        <Pressable
          key={p.id}
          style={[
            styles.preset,
            presetId === p.id && !Object.keys(overrides).length && styles.presetActive,
          ]}
          onPress={() => selectPreset(p.id)}
        >
          <Text style={styles.presetName}>{p.name}</Text>
          <Text style={styles.presetDesc}>{p.description}</Text>
        </Pressable>
      ))}

      <Text style={[styles.heading, { marginTop: 24 }]}>Custom Overrides</Text>
      <Text style={styles.sub}>
        Based on "{presets.find((p) => p.id === presetId)?.name}". Adjust and tap Save Custom Rules.
      </Text>

      {CUSTOMIZABLE_FIELDS.map((field) => {
        const val = preview[field.key];
        if (field.type === 'boolean') {
          return (
            <View key={field.key} style={styles.row}>
              <Text style={styles.rowLabel}>{field.label}</Text>
              <Switch
                value={Boolean(val)}
                onValueChange={(v) => updateOverride(field.key, v)}
                trackColor={{ true: '#fbbf24' }}
              />
            </View>
          );
        }
        return (
          <View key={field.key} style={styles.row}>
            <Text style={styles.rowLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(val ?? '')}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                if (isNaN(n)) return;
                const min = field.min ?? n;
                const max = field.max ?? n;
                updateOverride(field.key, Math.min(max, Math.max(min, n)));
              }}
            />
          </View>
        );
      })}

      {errors.length > 0 && (
        <View style={styles.errors}>
          {errors.map((e) => (
            <Text key={e} style={styles.errorText}>
              {e}
            </Text>
          ))}
        </View>
      )}

      <Pressable style={styles.saveBtn} onPress={applyCustom}>
        <Text style={styles.saveBtnText}>Save Custom Rules</Text>
      </Pressable>

      {saved && <Text style={styles.saved}>Rules saved!</Text>}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Active Rules Summary</Text>
        <SummaryLine label="Target score" value={preview.targetScore} />
        <SummaryLine label="Cards per hand" value={preview.cardsPerHand} />
        <SummaryLine
          label="Canastas to go out"
          value={
            preview.canastasRequiredToGoOut === 0 ? 'None' : preview.canastasRequiredToGoOut
          }
        />
        <SummaryLine
          label="Partner discard required"
          value={preview.requirePartnerTookDiscard ? 'Yes' : 'No'}
        />
        <SummaryLine label="Frozen pile" value={preview.frozenPileEnabled ? 'Yes' : 'No'} />
      </View>
    </View>
  );
}

function SummaryLine({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  loading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
  },
  heading: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sub: { color: '#94a3b8', fontSize: 13, marginBottom: 16 },
  preset: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetActive: { borderColor: '#fbbf24' },
  presetName: { color: '#f8fafc', fontWeight: '700', fontSize: 15 },
  presetDesc: { color: '#64748b', fontSize: 12, marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  rowLabel: { color: '#e2e8f0', flex: 1, fontSize: 13, paddingRight: 12 },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: '#0f172a', fontWeight: '800' },
  saved: { color: '#86efac', textAlign: 'center', marginTop: 8 },
  errors: { marginTop: 8 },
  errorText: { color: '#f87171', fontSize: 12 },
  summary: {
    marginTop: 24,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: { color: '#fbbf24', fontWeight: '700', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { color: '#94a3b8', fontSize: 12 },
  summaryValue: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
});
