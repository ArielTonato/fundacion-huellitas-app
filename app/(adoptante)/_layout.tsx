import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@src/theme/colors';
import { RoleGuard } from '@src/shared/components/RoleGuard';

export default function AdoptanteLayout(): React.JSX.Element {
  return (
    <RoleGuard allowedRoles={['adoptante']}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: { backgroundColor: Colors.white },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Catalogo',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paw" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mis-solicitudes"
          options={{
            title: 'Solicitudes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reportes/index"
          options={{
            title: 'Reportes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="alert-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="animal/[id]"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="solicitud/[animalId]"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="reportes/reportar"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="reportes/mapa"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="reportes/[id]"
          options={{ href: null }}
        />
      </Tabs>
    </RoleGuard>
  );
}
