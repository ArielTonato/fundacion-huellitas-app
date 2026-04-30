import { Stack } from 'expo-router';

export default function ReportesLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="reportar"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="mapa" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
