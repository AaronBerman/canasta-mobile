import { Redirect } from 'expo-router';

export default function CustomizeScreen() {
  return <Redirect href="/settings?tab=customize" />;
}
