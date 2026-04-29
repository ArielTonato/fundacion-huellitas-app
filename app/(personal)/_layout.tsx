import { RoleGuard } from '@src/shared/components/RoleGuard';
import { Stack } from 'expo-router';

export default function PersonalLayout(): React.JSX.Element {
  return (
    <RoleGuard allowedRoles={['personal']}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="animal/registrar"
          options={{ presentation: 'transparentModal' }}
        />
        <Stack.Screen
          name="animal/editar/[id]"
          options={{ presentation: 'transparentModal' }}
        />
      </Stack>
    </RoleGuard>
  );
}
