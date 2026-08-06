import { Redirect } from 'expo-router';

export default function RulesScreen() {
  return <Redirect href="/settings?tab=rules" />;
}
