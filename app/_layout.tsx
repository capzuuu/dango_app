import { ContinueWatchingProvider } from '@/context/continue-watching-context';
import { MyListProvider } from '@/context/my-list-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ContinueWatchingProvider>
    <MyListProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile-select" />
        <Stack.Screen name="details" />
        <Stack.Screen name="player" />
      </Stack>
      <StatusBar style="light" />
    </MyListProvider>
    </ContinueWatchingProvider>
  );
}
