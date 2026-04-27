import { Stack } from 'expo-router';
import { Colors } from '@src/theme/colors';
import { RoleGuard } from '@src/shared/components/RoleGuard';
import { useAuth } from '@src/shared/hooks/useAuth';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function SuperAdminLayout(): React.JSX.Element {
  const { signOut } = useAuth();

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesion.', error);
      throw error;
    }
  };

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Gestion de Usuarios',
            headerRight: () => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void handleSignOut();
                }}
                style={styles.signOutButton}
              >
                <Text style={styles.signOutText}>Cerrar sesion</Text>
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  signOutButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  signOutText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
