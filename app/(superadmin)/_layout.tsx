import { Stack } from 'expo-router';
import { Colors } from '@src/theme/colors';
import { RoleGuard } from '@src/shared/components/RoleGuard';

export default function SuperAdminLayout(): React.JSX.Element {
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Gestion de Usuarios' }} />
      </Stack>
    </RoleGuard>
  );
}
